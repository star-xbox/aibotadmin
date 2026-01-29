using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using System;

namespace EBS2.Server.Common;

public class GlobalRoutePrefixConvention : IApplicationModelConvention
{
    private readonly AttributeRouteModel _routePrefix;

    public GlobalRoutePrefixConvention(string prefix)
    {
        _routePrefix = new AttributeRouteModel(new RouteAttribute(prefix));
    }

    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        {
            foreach (var selector in controller.Selectors)
            {
                if (selector.AttributeRouteModel == null || selector.AttributeRouteModel.Template == null)
                {
                    selector.AttributeRouteModel = _routePrefix;
                }
                else
                {
                    if (!selector.AttributeRouteModel.Template.StartsWith(_routePrefix.Template + "/"))
                    {
                        selector.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(
                            _routePrefix,
                            selector.AttributeRouteModel
                        );
                    }
                }
            }
        }
    }
}