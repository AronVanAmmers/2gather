FROM eris/decerver:latest

USER root

COPY *.sh /home/$user/

# Copy in langauges config for compiler
RUN mkdir --parents /home/$user/.decerver/languages
COPY languages_config.json /home/$user/.decerver/languages/config.json

# Get the DAPP.
RUN mkdir --parents /home/$user/.decerver/dapps/2gather
WORKDIR /home/$user/.decerver/dapps/2gather

COPY . /home/$user/.decerver/dapps/2gather/

RUN chown --recursive $user /home/$user

USER $user
CMD ~/cmd.sh
