FROM gitpod/workspace-full
SHELL ["/bin/bash", "-c"]

RUN sudo apt-get -qq update

# Install cypress dependencies
RUN sudo DEBIAN_FRONTEND=noninteractive apt-get install -y libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# Install ddev
RUN brew update && brew install drud/ddev/ddev

# Install latest composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN sudo php composer-setup.php --install-dir /usr/bin --filename composer
RUN php -r "unlink('composer-setup.php');"
