FROM php:8.2-apache

RUN docker-php-ext-install mysqli \
    && a2enmod rewrite headers

WORKDIR /var/www/html
COPY . /var/www/html/

RUN mkdir -p /var/www/html/uploads/pictogramas \
    && chown -R www-data:www-data /var/www/html/uploads

EXPOSE 80
