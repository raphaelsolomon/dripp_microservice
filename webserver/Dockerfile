FROM nginx:alpine

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY gateway.crt /etc/nginx/ssl/api-gateway.crt
COPY gateway.key /etc/nginx/ssl/api-gateway.key

CMD ["nginx", "-g", "daemon off;"]