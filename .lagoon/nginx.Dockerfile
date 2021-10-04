FROM uselagoon/nginx:latest
COPY redirects-map.conf /etc/nginx/redirects-map.conf
RUN fix-permissions /etc/nginx
