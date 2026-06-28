FROM golang:1.26-alpine AS builder

WORKDIR /src
COPY . .

RUN go build -o /out/retronet-ui ./cmd/retronet-ui

FROM alpine:latest

WORKDIR /app
COPY --from=builder /out/retronet-ui /app/retronet-ui

EXPOSE 18081
ENTRYPOINT ["/app/retronet-ui"]
CMD ["-addr", ":18081"]
