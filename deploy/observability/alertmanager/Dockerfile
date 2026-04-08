FROM busybox:1.37.0-musl AS busybox

FROM quay.io/prometheus/alertmanager:v0.31.1

COPY --from=busybox /bin/busybox /bin/busybox
RUN ["/bin/busybox", "--install", "-s", "/bin"]

COPY deploy/observability/alertmanager/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
