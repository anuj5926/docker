const Docker = require("dockerode")

var docker = new Docker();

async function startContainer(image) {

    const container = await docker.createContainer({
        Image: image,  // Your image name
        AttachStdout: true,  // Attach standard output for logging
        Env: ['VNC_PW=password'],  // Set environment variable for VNC password
        HostConfig: {
            PortBindings: {
                '6901/tcp': [{ HostPort: '8000' }]  // Map port 6901 of the container to port 8000 on the host
            },
            ShmSize: 536870912,  // Set shared memory size to 512MB (536870912 bytes)
            AutoRemove: true,  // Automatically remove the container once it's stopped (equivalent to `--rm` in CLI)
        }
    });

    await container.start()

    return ({ container: container.id, ip: "127.0.0.1", port: "8000", url: "https://127.0.0.1:8000" })

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

async function dockerChrome() {

    const image = 'kasmweb/chrome:1.16.0';
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