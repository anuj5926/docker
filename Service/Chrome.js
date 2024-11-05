const Docker = require("dockerode")
const { db } = require("../constant");

var docker = new Docker();

docker.getEvents(function (err, stream) {
    if (err) {
        console.log("Error in getting event", err);
        return err;
    }

    stream.on("data", async (chunk) => {
        if (!chunk) return;

        const event = JSON.parse(chunk.toString());

        if (event.Type === "container" && event.Action === "start") {
            const container = docker.getContainer(event.id);
            const containerInfo = await container.inspect();

            console.log(containerInfo);

            const containerName = containerInfo.Name.substring(1);
            const ipAddress = containerInfo.NetworkSettings.IPAddress;

            const exposedPort = Object.keys(containerInfo.Config.ExposedPorts);
            const imageName = containerInfo.Config.Image.split("/")[0]
            let defaultPort = null;


            if (exposedPort && exposedPort.length > 0) {

                if (imageName === "kasmweb") {
                    defaultPort = "6901";
                } else {
                    const [port, type] = exposedPort[0].split('/');
                    if (type === "tcp") {
                        defaultPort = port;
                    }
                }

            }

            console.log(containerName, "---> ", `https://${ipAddress}:${defaultPort}`)

            db.set(containerName, { containerName, ipAddress, defaultPort });

            console.log(db);
        }
    })
})

async function startContainer(image) {

    const container = await docker.createContainer({
        Image: image,  // Your image name
        AttachStdout: true,  // Attach standard output for logging
        Env: ['VNC_PW=password'],  // Set environment variable for VNC password
        HostConfig: {
            // PortBindings: {
            //     '6901/tcp': [{ HostPort: '8001' }]  // Map port 6901 of the container to port 8000 on the host
            // },
            ShmSize: 536870912,  // Set shared memory size to 512MB (536870912 bytes)
            AutoRemove: true,  // Automatically remove the container once it's stopped (equivalent to `--rm` in CLI)
        }
    });

    await container.start()

    return ({ container: container.id, container_name: (await container.inspect()).Name, url: `http://192.168.0.210:5000?name=${((await container.inspect()).Name)}` })
}

function pullDockerImage(image) {
    return new Promise((resolve, reject) => {
        docker.pull(image, (err, stream) => {
            if (err) {
                console.error('Error pulling image:', err);
                return reject(err);
            }

            stream.on('data', (data) => {
                console.log('Data:', data.toString());
            });

            stream.on('end', () => {
                console.log('Image pull complete');
                resolve('Image pull complete');
            });

            stream.on('error', (err) => {
                console.error('Stream error:', err);
                reject(err);
            });
        });
    });
}

async function checkImageExists(imageName) {
    try {
        const images = await docker.listImages();

        const imageExists = images.some(image => image.RepoTags && image.RepoTags.includes(imageName));

        if (imageExists) {
            console.log(`Image ${imageName} is already present.`);
            return false;
        } else {
            console.log(`Image ${imageName} is not present.`);
            return true;
        }
    } catch (error) {
        console.error('Error fetching images:', error);
    }
}

async function dockerChrome(req) {

    const image = req.body.image;
    let isPresent = await checkImageExists(image);
    let spinContainer;

    if (isPresent) {
        const pulledImage = await pullDockerImage(image);

        if (pulledImage === "Image pull complete") {
            spinContainer = await startContainer(image);
        } else {
            return pulledImage;  // if get an error
        }

    } else {
        spinContainer = await startContainer(image);
    }

    return spinContainer;
}

module.exports = dockerChrome;