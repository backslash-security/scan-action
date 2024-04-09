FROM ubuntu:14.04
COPY ./file.sh /
run chmod +x file.sh
ENTRYPOINT ["/file.sh"]