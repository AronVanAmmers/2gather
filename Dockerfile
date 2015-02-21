FROM eris/decerver:latest

USER root

COPY *.sh /home/$user/
RUN chown $user /home/$user/*

USER $user

# Get the DAPP.

RUN mkdir --parents /home/$user/.decerver/source/2gather
WORKDIR /home/$user/.decerver/source/2gather

RUN curl --location https://github.com/eris-ltd/2gather/archive/master.tar.gz \
 | tar --extract --gzip --strip-components=1

CMD ~/cmd.sh
