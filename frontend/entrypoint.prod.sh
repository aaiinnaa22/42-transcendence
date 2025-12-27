#!/bin/sh
set -e

export DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
export NGINX_PORT="${NGINX_PORT:-8443}"

# Files where environmental variables need to be substituted
TEMPLATES="
/etc/nginx/conf.d/server.conf.template
/etc/nginx/snippets/security-headers.conf.template
"

# Substitute variables within template configs
for template in $TEMPLATES; do
	if [ -f "$template" ]; then
		output="${template%.template}"
		envsubst '${DOMAIN_NAME} ${NGINX_PORT}' < "$template" > "$output"
	else
		echo "Template file $template missing"
		exit 1
	fi
done

# Verify config
nginx -t

# Set NGINX as the foreground application
echo "Launching NGINX"
nginx -g 'daemon off;'
