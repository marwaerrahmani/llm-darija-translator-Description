package ma.nfaoui.translator.filter;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.io.IOException;

/**
 * JAX-RS filter that logs incoming requests and outgoing responses for auditing.
 */
@Provider
public class RequestLoggingFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final Logger LOG = Logger.getLogger(RequestLoggingFilter.class);

    private static final String START_TIME_PROPERTY = "requestStartTime";

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        requestContext.setProperty(START_TIME_PROPERTY, System.currentTimeMillis());
        LOG.infof("→ %s %s [from: %s]",
                  requestContext.getMethod(),
                  requestContext.getUriInfo().getRequestUri(),
                  requestContext.getHeaderString("User-Agent"));
    }

    @Override
    public void filter(ContainerRequestContext requestContext,
                       ContainerResponseContext responseContext) throws IOException {
        Long startTime = (Long) requestContext.getProperty(START_TIME_PROPERTY);
        long elapsed = startTime != null ? System.currentTimeMillis() - startTime : -1;
        LOG.infof("← %s %s [status: %d, took: %dms]",
                  requestContext.getMethod(),
                  requestContext.getUriInfo().getRequestUri(),
                  responseContext.getStatus(),
                  elapsed);
    }
}
