FROM denoland/deno:1.45.5

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /.nvll

COPY . .
RUN deno cache src/main.ts

EXPOSE 3000

CMD ["run", "-A", "--unstable-kv", "src/main.ts"]
