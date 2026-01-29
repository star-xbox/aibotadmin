using AIbotAdmin.Server.Models;
using BipVnDataBase;
using Serilog;
using System.Data;
using AIbotAdmin.Server.Common;
using ClosedXML.Excel;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace AIbotAdmin.Server.Services
{
    public interface IChatService
    {
        Task<PagedResult<ChatSessionSummary>> GetChatSessions(ChatListRequest request);
        Task<ChatSession?> GetChatSessionDetail(string sessionId);
        Task<bool> DeleteChatSession(string sessionId);
        Task<byte[]> ExportChatSessions(ChatExportRequest request);
        Task<string> ExportSingleSession(string sessionId);
    }

    public class ChatService : IChatService
    {
        BipVnDb? _db;
        private readonly ILogger<ChatService> _logger;

        public ChatService(IDbService dbService, ILogger<ChatService> logger)
        {
            _db = dbService.CurrentDb();
            _logger = logger;
        }

        public async Task<PagedResult<ChatSessionSummary>> GetChatSessions(ChatListRequest request)
        {
            Dictionary<string, object>? output = null;

            // Xử lý DateTime từ SelectedDate + StartTime/EndTime
            DateTime? startDateTime = null;
            DateTime? endDateTime = null;

            if (request.SelectedDate.HasValue)
            {
                var baseDate = request.SelectedDate.Value.Date;

                // Nếu có StartTime thì combine, không thì lấy đầu ngày (00:00:00)
                startDateTime = request.StartTime.HasValue
                    ? baseDate.Add(request.StartTime.Value)
                    : baseDate;

                // Nếu có EndTime thì combine, không thì lấy cuối ngày (23:59:59)
                endDateTime = request.EndTime.HasValue
                    ? baseDate.Add(request.EndTime.Value)
                    : baseDate.AddDays(1).AddTicks(-1);
            }

            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_PAGE_NUMBER", DbType.Int32, request.PageNumber),
                _db!.CreateInParameter("@IN_PAGE_SIZE", DbType.Int32, request.PageSize),
                _db!.CreateInParameter("@IN_SESSION_ID", DbType.String, (object?)request.SessionId ?? DBNull.Value),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int64, (object?)request.UserCD ?? DBNull.Value),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, (object?)request.UserName ?? DBNull.Value),
                _db!.CreateInParameter("@IN_STATUS", DbType.String, (object?)request.Status ?? DBNull.Value),
                _db!.CreateInParameter("@IN_START_DATE", DbType.DateTime2, (object?)startDateTime ?? DBNull.Value),
                _db!.CreateInParameter("@IN_END_DATE", DbType.DateTime2, (object?)endDateTime ?? DBNull.Value),
                _db!.CreateInParameter("@IN_SEARCH_TEXT", DbType.String, (object?)request.SearchText ?? DBNull.Value),
                _db!.CreateInParameter("@IN_SORT_COLUMN", DbType.String, (object?)request.SortColumn ?? "StartTime"),
                _db!.CreateInParameter("@IN_SORT_DIRECTION", DbType.String, (object?)request.SortDirection ?? "DESC"),
                _db!.CreateOutParameter("@OUT_TOTAL_COUNT", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };

            try
            {
                var dbValue = _db!.StoredProcedure("T_QA_Log_Get_Sessions", parameters, out output);

                if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
                {
                    int err_cd = output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]);
                    string? err_msg = output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]);

                    if (err_cd == 0)
                    {
                        var items = ((BipVnDbResult)dbValue).ToList<ChatSessionSummary>();
                        int totalCount = output["@OUT_TOTAL_COUNT"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_TOTAL_COUNT"]);

                        return new PagedResult<ChatSessionSummary>
                        {
                            Items = items,
                            TotalCount = totalCount,
                            PageNumber = request.PageNumber,
                            PageSize = request.PageSize
                        };
                    }
                    else
                    {
                        throw new Exception(err_msg);
                    }
                }
                else
                {
                    throw (Exception)dbValue!;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions with request: {@Request}", request);
                throw;
            }
        }

        public async Task<ChatSession?> GetChatSessionDetail(string sessionId)
        {
            Dictionary<string, object>? output = null;

            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_SESSION_ID", DbType.String, sessionId),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };

            try
            {
                var dbValue = _db!.StoredProcedure("T_QA_Log_Get_Session_Detail", parameters, out output);

                if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
                {
                    int err_cd = output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]);
                    string? err_msg = output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]);

                    if (err_cd == 0)
                    {
                        var qaLogs = ((BipVnDbResult)dbValue).ToList<T_QALog>();

                        if (qaLogs.Count == 0)
                            return null;

                        var sortedLogs = qaLogs.OrderBy(x => x.TurnNo).ToList();
                        var firstLog = sortedLogs.First();
                        var lastLog = sortedLogs.Last();

                        var hasResolved = sortedLogs.Any(x => x.ResolvedTurnNo != null);

                        var lastRegisteredAt = lastLog.RegisteredAt ?? DateTime.MinValue;

                        var session = new ChatSession
                        {
                            SessionId = sessionId,
                            UserCD = firstLog.UserCD,
                            UserName = await GetUserName(firstLog.UserCD),
                            StartTime = firstLog.RegisteredAt ?? DateTime.MinValue,
                            EndTime = lastRegisteredAt,
                            TurnCount = sortedLogs.Count,
                            Status = hasResolved ? "completed" : "uncompleted",
                            QALogs = sortedLogs
                        };

                        return session;
                    }
                    else
                    {
                        throw new Exception(err_msg);
                    }
                }
                else
                {
                    throw (Exception)dbValue!;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting chat session detail for session {sessionId}");
                throw;
            }
        }

        public async Task<bool> DeleteChatSession(string sessionId)
        {
            Dictionary<string, object>? output = null;

            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_SESSION_ID", DbType.String, sessionId),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };

            try
            {
                var dbValue = _db!.StoredProcedure("T_QA_Log_Delete_Session", parameters, out output);

                int err_cd = output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]);
                string? err_msg = output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]);

                if (err_cd == 0)
                {
                    await Task.CompletedTask;
                    return true;
                }
                else
                {
                    throw new Exception(err_msg);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting chat session {sessionId}");
                throw;
            }
        }

        public async Task<byte[]> ExportChatSessions(ChatExportRequest request)
        {
            var sessions = await GetExportData(request);

            return request.Format?.ToLower() switch
            {
                "excel" => GenerateExcel(sessions),
                "pdf" => GeneratePdf(sessions),
                _ => GenerateCsv(sessions)
            };
        }

        public async Task<string> ExportSingleSession(string sessionId)
        {
            var session = await GetChatSessionDetail(sessionId);
            if (session == null)
                throw new Exception($"Session {sessionId} not found");

            var content = new System.Text.StringBuilder();
            content.AppendLine("=".PadRight(80, '='));
            content.AppendLine($"CHAT SESSION REPORT");
            content.AppendLine("=".PadRight(80, '='));
            content.AppendLine();
            content.AppendLine($"Session ID:    {session.SessionId}");
            content.AppendLine($"User:          {session.UserName} (UserCD: {session.UserCD?.ToString() ?? "N/A"})");
            content.AppendLine($"Start Time:    {session.StartTime:yyyy-MM-dd HH:mm:ss}");
            content.AppendLine($"End Time:      {session.EndTime:yyyy-MM-dd HH:mm:ss}");
            content.AppendLine($"Duration:      {(session.EndTime - session.StartTime).TotalMinutes:F1} minutes");
            content.AppendLine($"Status:        {session.Status.ToUpper()}");
            content.AppendLine($"Total Turns:   {session.TurnCount}");
            content.AppendLine();
            content.AppendLine("=".PadRight(80, '='));
            content.AppendLine("CONVERSATION HISTORY");
            content.AppendLine("=".PadRight(80, '='));

            foreach (var log in session.QALogs)
            {
                content.AppendLine();
                content.AppendLine($"[Turn {log.TurnNo}] {log.RegisteredAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A"}");
                content.AppendLine($"QALogCD: {log.QALogCD}");
                if (log.ResolvedTurnNo != null)
                    content.AppendLine($"*** RESOLVED at Turn {log.ResolvedTurnNo} ***");
                content.AppendLine();
                content.AppendLine($"Q: {log.QuestionText}");
                content.AppendLine();
                content.AppendLine($"A: {log.AnswerText}");
                content.AppendLine("-".PadRight(80, '-'));
            }

            content.AppendLine();
            content.AppendLine("=".PadRight(80, '='));
            content.AppendLine("END OF REPORT");
            content.AppendLine("=".PadRight(80, '='));

            return content.ToString();
        }

        private async Task<List<ChatSessionSummary>> GetExportData(ChatExportRequest request)
        {
            Dictionary<string, object>? output = null;

            DateTime? startDateTime = null;
            DateTime? endDateTime = null;

            if (request.SelectedDate.HasValue)
            {
                var baseDate = request.SelectedDate.Value.Date;

                startDateTime = request.StartTime.HasValue
                    ? baseDate.Add(request.StartTime.Value)
                    : baseDate;

                endDateTime = request.EndTime.HasValue
                    ? baseDate.Add(request.EndTime.Value)
                    : baseDate.AddDays(1).AddTicks(-1);
            }

            var parameters = new List<IDbDataParameter> {
                _db!.CreateInParameter("@IN_SESSION_ID", DbType.String, (object?)request.SessionId ?? DBNull.Value),
                _db!.CreateInParameter("@IN_USER_CD", DbType.Int64, (object?)request.UserCD ?? DBNull.Value),
                _db!.CreateInParameter("@IN_USER_NAME", DbType.String, (object?)request.UserName ?? DBNull.Value),
                _db!.CreateInParameter("@IN_STATUS", DbType.String, (object?)request.Status ?? DBNull.Value),
                _db!.CreateInParameter("@IN_START_DATE", DbType.DateTime2, (object?)startDateTime ?? DBNull.Value),
                _db!.CreateInParameter("@IN_END_DATE", DbType.DateTime2, (object?)endDateTime ?? DBNull.Value),
                _db!.CreateInParameter("@IN_SEARCH_TEXT", DbType.String, (object?)request.SearchText ?? DBNull.Value),
                _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
            };

            var dbValue = _db!.StoredProcedure("T_QA_Log_Export_Sessions", parameters, out output);

            if (dbValue != null && dbValue != DBNull.Value && dbValue.GetType().Name == "BipVnDbResult")
            {
                int err_cd = output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]);
                string? err_msg = output["@OUT_ERR_MSG"] == DBNull.Value ? string.Empty : Convert.ToString(output["@OUT_ERR_MSG"]);

                if (err_cd == 0)
                {
                    return ((BipVnDbResult)dbValue).ToList<ChatSessionSummary>();
                }
                else
                {
                    throw new Exception(err_msg);
                }
            }
            else
            {
                throw (Exception)dbValue!;
            }
        }

        private byte[] GenerateCsv(List<ChatSessionSummary> sessions)
        {
            using var memoryStream = new System.IO.MemoryStream();
            using var writer = new System.IO.StreamWriter(memoryStream, System.Text.Encoding.UTF8);

            writer.WriteLine("SessionId,UserCD,UserName,StartTime,EndTime,TurnCount,Status,LastQuestion,LastAnswer");

            foreach (var session in sessions)
            {
                var escapedQuestion = EscapeCsvField(session.LastQuestion);
                var escapedAnswer = EscapeCsvField(session.LastAnswer);
                var escapedUserName = EscapeCsvField(session.UserName);

                writer.WriteLine(
                    $"\"{session.SessionId}\"," +
                    $"{session.UserCD?.ToString() ?? ""}," +
                    $"\"{escapedUserName}\"," +
                    $"\"{session.StartTime:yyyy-MM-dd HH:mm:ss}\"," +
                    $"\"{session.EndTime:yyyy-MM-dd HH:mm:ss}\"," +
                    $"{session.TurnCount}," +
                    $"\"{session.Status}\"," +
                    $"\"{escapedQuestion}\"," +
                    $"\"{escapedAnswer}\""
                );
            }

            writer.Flush();
            return memoryStream.ToArray();
        }

        private byte[] GenerateExcel(List<ChatSessionSummary> sessions)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Chat Sessions");

            // Header styling
            worksheet.Cell(1, 1).Value = "Session ID";
            worksheet.Cell(1, 2).Value = "User CD";
            worksheet.Cell(1, 3).Value = "User Name";
            worksheet.Cell(1, 4).Value = "Start Time";
            worksheet.Cell(1, 5).Value = "End Time";
            worksheet.Cell(1, 6).Value = "Turn Count";
            worksheet.Cell(1, 7).Value = "Status";
            worksheet.Cell(1, 8).Value = "Last Question";
            worksheet.Cell(1, 9).Value = "Last Answer";

            var headerRange = worksheet.Range(1, 1, 1, 9);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Data rows
            int row = 2;
            foreach (var session in sessions)
            {
                worksheet.Cell(row, 1).Value = session.SessionId;
                worksheet.Cell(row, 2).Value = session.UserCD?.ToString() ?? "";
                worksheet.Cell(row, 3).Value = session.UserName;
                worksheet.Cell(row, 4).Value = session.StartTime.ToString("yyyy-MM-dd HH:mm:ss");
                worksheet.Cell(row, 5).Value = session.EndTime.ToString("yyyy-MM-dd HH:mm:ss");
                worksheet.Cell(row, 6).Value = session.TurnCount;
                worksheet.Cell(row, 7).Value = session.Status;
                worksheet.Cell(row, 8).Value = session.LastQuestion;
                worksheet.Cell(row, 9).Value = session.LastAnswer;

                // Status color coding
                var statusCell = worksheet.Cell(row, 7);
                if (session.Status == "completed")
                {
                    statusCell.Style.Fill.BackgroundColor = XLColor.LightGreen;
                }
                else if (session.Status == "uncompleted")
                {
                    statusCell.Style.Fill.BackgroundColor = XLColor.LightGray;
                }

                row++;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            // Add borders
            var dataRange = worksheet.Range(1, 1, row - 1, 9);
            dataRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            dataRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

            using var stream = new System.IO.MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private byte[] GeneratePdf(List<ChatSessionSummary> sessions)
        {
            using var stream = new System.IO.MemoryStream();
            var document = new Document(PageSize.A4, 36, 36, 36, 36); // Margins: left, right, top, bottom

            var writer = PdfWriter.GetInstance(document, stream);
            document.Open();

            // Tạo BaseFont với encoding hỗ trợ Unicode và embed font
            BaseFont baseFont;
            try
            {
                // Thử các font phổ biến hỗ trợ tiếng Nhật
                string[] fontPaths = new[]
                {
            @"C:\Windows\Fonts\msgothic.ttc,0",  // MS Gothic - font chính cho tiếng Nhật
            @"C:\Windows\Fonts\msmincho.ttc,0",
            @"C:\Windows\Fonts\meiryo.ttc,0",
            @"C:\Windows\Fonts\yugothic.ttf",
            @"C:\Windows\Fonts\arialuni.ttf",
        };

                baseFont = null;
                foreach (var fontPath in fontPaths)
                {
                    try
                    {
                        baseFont = BaseFont.CreateFont(
                            fontPath,
                            BaseFont.IDENTITY_H,
                            BaseFont.EMBEDDED);
                        break;
                    }
                    catch
                    {
                        continue;
                    }
                }

                // Nếu không load được font nào, dùng Helvetica (sẽ không hiển thị được tiếng Nhật)
                if (baseFont == null)
                {
                    baseFont = BaseFont.CreateFont(
                        BaseFont.HELVETICA,
                        BaseFont.CP1252,
                        BaseFont.EMBEDDED);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Japanese fonts, falling back to Helvetica");
                baseFont = BaseFont.CreateFont(
                    BaseFont.HELVETICA,
                    BaseFont.CP1252,
                    BaseFont.EMBEDDED);
            }

            var fontTitle = new iTextSharp.text.Font(baseFont, 16, iTextSharp.text.Font.BOLD);
            var fontHeader = new iTextSharp.text.Font(baseFont, 12, iTextSharp.text.Font.BOLD);
            var fontNormal = new iTextSharp.text.Font(baseFont, 9);
            var fontSmall = new iTextSharp.text.Font(baseFont, 8);
            var fontBold = new iTextSharp.text.Font(baseFont, 9, iTextSharp.text.Font.BOLD);

            // Tiêu đề chính
            var title = new Paragraph("CHAT SESSIONS REPORT", fontTitle);
            title.Alignment = Element.ALIGN_CENTER;
            title.SpacingAfter = 10;
            document.Add(title);

            var dateTime = new Paragraph($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}", fontSmall);
            dateTime.Alignment = Element.ALIGN_CENTER;
            dateTime.SpacingAfter = 20;
            document.Add(dateTime);

            // Thêm từng session với đầy đủ thông tin
            int sessionNum = 1;
            foreach (var session in sessions)
            {
                // Session header
                var sessionHeader = new Paragraph($"SESSION #{sessionNum}: {session.SessionId}", fontHeader);
                sessionHeader.SpacingBefore = 15;
                sessionHeader.SpacingAfter = 10;
                document.Add(sessionHeader);

                // Thông tin session - dùng table để format đẹp
                var infoTable = new PdfPTable(2);
                infoTable.WidthPercentage = 100;
                infoTable.SetWidths(new float[] { 1f, 3f });
                infoTable.SpacingAfter = 10;

                AddInfoRow(infoTable, "User:", session.UserName ?? "Anonymous", fontBold, fontNormal);
                AddInfoRow(infoTable, "User CD:", session.UserCD?.ToString() ?? "N/A", fontBold, fontNormal);
                AddInfoRow(infoTable, "Start Time:", session.StartTime.ToString("yyyy-MM-dd HH:mm:ss"), fontBold, fontNormal);
                AddInfoRow(infoTable, "End Time:", session.EndTime.ToString("yyyy-MM-dd HH:mm:ss"), fontBold, fontNormal);
                AddInfoRow(infoTable, "Turn Count:", session.TurnCount.ToString(), fontBold, fontNormal);
                AddInfoRow(infoTable, "Status:", session.Status ?? "Unknown", fontBold, fontNormal);

                document.Add(infoTable);

                // Conversation content
                if (!string.IsNullOrEmpty(session.LastQuestion) || !string.IsNullOrEmpty(session.LastAnswer))
                {
                    var conversationHeader = new Paragraph("Last Conversation:", fontBold);
                    conversationHeader.SpacingBefore = 5;
                    conversationHeader.SpacingAfter = 5;
                    document.Add(conversationHeader);

                    // Question
                    if (!string.IsNullOrEmpty(session.LastQuestion))
                    {
                        var questionLabel = new Paragraph("Question: ", fontBold);
                        questionLabel.SpacingAfter = 2;
                        document.Add(questionLabel);

                        var questionContent = new Paragraph(session.LastQuestion, fontNormal);
                        questionContent.IndentationLeft = 20;
                        questionContent.SpacingAfter = 8;
                        questionContent.Alignment = Element.ALIGN_JUSTIFIED;
                        document.Add(questionContent);
                    }

                    // Answer
                    if (!string.IsNullOrEmpty(session.LastAnswer))
                    {
                        var answerLabel = new Paragraph("Answer: ", fontBold);
                        answerLabel.SpacingAfter = 2;
                        document.Add(answerLabel);

                        var answerContent = new Paragraph(session.LastAnswer, fontNormal);
                        answerContent.IndentationLeft = 20;
                        answerContent.SpacingAfter = 10;
                        answerContent.Alignment = Element.ALIGN_JUSTIFIED;
                        document.Add(answerContent);
                    }
                }

                // Separator line
                if (sessionNum < sessions.Count)
                {
                    var line = new iTextSharp.text.pdf.draw.LineSeparator(1f, 100f, BaseColor.LightGray, Element.ALIGN_CENTER, -5);
                    document.Add(new Chunk(line));
                }

                sessionNum++;

                // Kiểm tra nếu cần trang mới
                if (writer.GetVerticalPosition(false) < 100)
                {
                    document.NewPage();
                }
            }

            // Footer
            var footer = new Paragraph($"Total Sessions: {sessions.Count}", fontSmall);
            footer.Alignment = Element.ALIGN_CENTER;
            footer.SpacingBefore = 20;
            document.Add(footer);

            document.Close();
            return stream.ToArray();
        }

        // Helper method để thêm row vào info table
        private void AddInfoRow(PdfPTable table, string label, string value, iTextSharp.text.Font labelFont, iTextSharp.text.Font valueFont)
        {
            var labelCell = new PdfPCell(new Phrase(label, labelFont));
            labelCell.Border = Rectangle.NO_BORDER;
            labelCell.PaddingBottom = 5;
            labelCell.PaddingRight = 10;
            table.AddCell(labelCell);

            var valueCell = new PdfPCell(new Phrase(value, valueFont));
            valueCell.Border = Rectangle.NO_BORDER;
            valueCell.PaddingBottom = 5;
            table.AddCell(valueCell);
        }

        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
                return string.Empty;

            return field.Replace("\"", "\"\"");
        }

        private async Task<string> GetUserName(long? userCD)
        {
            if (!userCD.HasValue)
                return "Anonymous";

            try
            {
                var parameters = new List<IDbDataParameter> {
                    _db!.CreateInParameter("@IN_USER_CD", DbType.Int64, userCD.Value),
                    _db!.CreateOutParameter("@OUT_USER_NAME", DbType.String, 200),
                    _db!.CreateOutParameter("@OUT_ERR_CD", DbType.Int32, 10),
                    _db!.CreateOutParameter("@OUT_ERR_MSG", DbType.String, 255)
                };

                var dbValue = _db!.StoredProcedure("M_User_Get_Name", parameters, out var output);

                int err_cd = output["@OUT_ERR_CD"] == DBNull.Value ? 0 : Convert.ToInt32(output["@OUT_ERR_CD"]);
                if (err_cd == 0)
                {
                    var userName = output["@OUT_USER_NAME"]?.ToString();
                    return !string.IsNullOrEmpty(userName) ? userName : $"User {userCD}";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user name for UserCD {userCD}");
            }

            return $"User {userCD}";
        }
    }
}