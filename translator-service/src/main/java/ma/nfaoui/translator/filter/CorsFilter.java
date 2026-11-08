package ma.nfaoui.translator.filter;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

/**
 * JAX-RS response filter that adds CORS headers to every response.
 * Required for browser-based clients (Chrome extension, web apps) to call the API.
 */
@Provider
public class CorsFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext,
                       ContainerResponseContext responseContext) {
        responseContext.getHeaders().add("Access-Control-Allow-Origin", "*");
        responseContext.getHeaders().add("Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS, HEAD");
        responseContext.getHeaders().add("Access-Control-Allow-Headers",
            "Origin, Accept, Content-Type, Authorization, X-Requested-With");
        responseContext.getHeaders().add("Access-Control-Max-Age", "86400");
        responseContext.getHeaders().add("Access-Control-Expose-Headers",
            "Content-Disposition, Content-Length");
    }
}
