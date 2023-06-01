const fs = require('fs-extra');
const tmp = require('tmp-promise');
const axios = require('axios');
const path = require('path');
const os = require('os');
const uuid = require('uuid');
const { FleekSdk, PersonalAccessTokenService } = require('@fleekxyz/sdk');

const cids = ['QmdAtVRSMpuJwSEt8hCXWMouj4pQAMpavGNF6suhUjMSK3']; // replace with your CIDs

const newAccessTokenService = new PersonalAccessTokenService({ personalAccessToken: '', projectId: '' });
const newSdk = new FleekSdk({ accessTokenService: newAccessTokenService });

async function transferFiles() {
  const cwd = process.cwd();
  const dirPath = path.join(cwd, uuid.v4()); // create a unique directory in the cwd
  await fs.ensureDir(dirPath); // ensure the directory is created

  // Download files from IPFS
  for (const cid of cids) {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const filePath = path.join(dirPath, cid);
    console.log(`Downloading ${url} to ${filePath}`);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    const writer = response.data.pipe(fs.createWriteStream(filePath));
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    if (!fs.existsSync(filePath)) {
      res.status(500).json({
        success: false,
        message: 'File not found',
      });
    }
    const stat = await fs.promises.stat(filePath);
    const wrapWithDirectory = stat.isDirectory(); 
    console.log(`Uploading ${cid} to Fleek`);
    const uploadedFile = await newSdk.ipfs().addFromPath(filePath, {wrapWithDirectory,});
    console.log(uploadedFile.pop().cid.toString());
  }


  console.log('Delete temporary directory');
  // Clean up the temporary directory
  await fs.remove(dirPath);
  console.log('Done');
  process.exit();
}

transferFiles().catch(console.error);

