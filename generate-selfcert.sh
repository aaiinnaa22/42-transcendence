#!/bin/sh
# generate-selfcert.sh

SECRETS_DIR="./secrets"
CERT_FILE="./secrets/ssl-cert"
KEY_FILE="./secrets/ssl-key"
SSL_COUNTRY="FI"
SSL_LOCALITY="Helsinki"
SSL_ORG="Hive"
SSL_ORG_UNIT="Student"
SSL_KEY_SIZE="2048"
SSL_VALIDITY="30"
SSL_DOMAIN="transcendence.example.com"

if [ ! -d ${SECRETS_DIR} ]; then
	mkdir -p ${SECRETS_DIR}
fi

if [ ! -f ${CERT_FILE} -o ! -f ${KEY_FILE} ]; then
    openssl req -x509 -nodes \
        -days ${SSL_VALIDITY} \
        -newkey rsa:${SSL_KEY_SIZE} \
        -keyout ${KEY_FILE} \
        -out ${CERT_FILE} \
        -subj "/C=${SSL_COUNTRY}/L=${SSL_LOCALITY}/O=${SSL_ORG}/OU=${SSL_ORG_UNIT}/CN=${SSL_DOMAIN}"
fi
