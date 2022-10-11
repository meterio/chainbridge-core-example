# Copyright 2020 ChainSafe Systems
# SPDX-License-Identifier: LGPL-3.0-only

FROM  golang:1.17-stretch AS builder
ADD ./chainbridge-core /src/chainbridge-core
ADD ./chainbridge-core-example /src/chainbridge-core-example
WORKDIR /src/chainbridge-core-example
RUN go mod download
RUN go build -o /bridge .

# # final stage
FROM debian:stretch-slim
RUN apt-get -y update && apt-get -y upgrade && apt-get install ca-certificates wget -y
RUN wget -P /usr/local/bin/ https://chainbridge.ams3.digitaloceanspaces.com/subkey-rc6 \
  && mv /usr/local/bin/subkey-rc6 /usr/local/bin/subkey \
  && chmod +x /usr/local/bin/subkey
RUN subkey --version

COPY --from=builder /bridge ./
RUN chmod +x ./bridge

ENTRYPOINT ["./bridge"]
