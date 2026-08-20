# Installing BHIMA with Docker

Using Docker and Docker Compose provides a simpler alternative to the traditional [Linux installation method](./installing-bhima.md).  To install Docker and Docker Compose, follow the instructions on [the official Docker site](https://docs.docker.com/engine/install/).  You will need to have installed Docker to follow this guide.

### System Requirements

Currently, BHIMA is compatible only with the x64 architecture. If you are using other architectures (such as ARM64 or x86), please refer to alternative installation instructions.

### Installation Steps

1. Clone the BHIMA repository

Retrieve the latest Docker Compose file by cloning the repository:

```bash
git clone --depth 1 https://github.com/Third-Culture-Software/bhima.git
cd bhima
```

2. Configure Environment Variables

Open the downloaded docker-compose.yml file and modify the following environment variables according to your setup:

- `PORT`: The port number where the application will be accessible.
- `MYSQL_USERNAME`, `DB_USER`: The username for database access.
- `DB_NAME`, `MYSQL_DATABASE`: The name of the database.
- `MYSQL_PASSWORD`, `DB_PASS`: The password for the database.

Launch the Application

Start the application by running:

```bash
docker compose up
```

This command builds the application and starts the services defined in the Docker Compose file. Wait for the download and setup to complete.

4. Verify the installation

Open a web browser and go to `http://localhost:<PORT>` to check if the application is running properly. Replace `<PORT>` with the port number you configured earlier.

Enjoy using BHIMA!
