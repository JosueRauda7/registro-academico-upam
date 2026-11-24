FROM postgres:16-alpine AS schema
COPY init.sql /tmp/init.sql
# Package the DDL only; demo users, hashes and academic fixtures stay out of the runtime image.
RUN awk '/^INSERT INTO / {exit} {print}' /tmp/init.sql > /tmp/schema.sql \
    && grep -q 'CREATE TABLE users' /tmp/schema.sql \
    && ! grep -q '^INSERT INTO ' /tmp/schema.sql

FROM postgres:16-alpine
COPY --from=schema /tmp/schema.sql /docker-entrypoint-initdb.d/10-schema.sql
COPY initial-settings.sql /docker-entrypoint-initdb.d/11-settings.sql
COPY security-role.sql /opt/upam/security-role.sql
COPY init-app-role.sh /docker-entrypoint-initdb.d/20-app-role.sh
RUN chmod 755 /docker-entrypoint-initdb.d/20-app-role.sh
