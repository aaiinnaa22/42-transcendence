#!/bin/sh
set -e

export DOMAIN_NAME="${DOMAIN_NAME:-localhost}"

# Files where environmental variables need to be substituted
TEMPLATES= "
	/etc/nginx/conf.d/server.conf.template
	/etc/nginx/snippets/security-headers.conf.template
"

# Substitute variables within template configs
for template in $TEMPLATES; do
	if [ -f "$template" ]; then
		output="${template%.template}"
		envsubst '${DOMAIN_NAME}' < "$template" > "$output"
	else
		echo "Template file $template missing"
		exit 1
	fi
done

# Verify config
nginx -t

# Set NGINX as the foreground application
nginx -g 'daemon off;'
