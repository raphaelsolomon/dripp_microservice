FROM nginx:alpine

COPY ./conf/nginx.conf /etc/nginx/nginx.conf
COPY api-gateway.crt /etc/nginx/ssl/api-gateway.crt
COPY api-gateway.key /etc/nginx/ssl/api-gateway.key

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]