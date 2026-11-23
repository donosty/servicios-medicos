FROM postgres:16-alpine
WORKDIR /migrations
COPY database /migrations/database
COPY deploy/migrations/migrate.sh /migrations/migrate.sh
RUN chmod 0755 /migrations/migrate.sh
ENTRYPOINT ["/migrations/migrate.sh"]
