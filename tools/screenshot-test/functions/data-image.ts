import * as firebaseFunctions from 'firebase-functions';
import {writeFileSync} from 'fs';
import {verifySecureToken} from './jwt-util';
import {isCreateEvent} from './util/util';

const gcs = require('@google-cloud/storage')();

/** The storage bucket to store the images. The bucket is also used by Firebase Storage. */
const bucket = gcs.bucket(firebaseFunctions.config().firebase.storageBucket);

/**
 * Writes base-64 encoded test images to png files on the filesystem.
 * Image data posted to database will be saved as png files
 * and uploaded to screenshot/$prNumber/dataType/$filename
 * Convert BufferArray to .png image file
 */
export function writeTestImagesToFiles(event: any) {
  // Only edit data when it is first created. Exit when the data is deleted.
  if (!isCreateEvent(event)) {
    return;
  }

  let dataType = event.params.dataType;
  let prNumber = event.params.prNumber;
  let data = event.data.val();
  let saveFilename = `${event.params.filename}.screenshot.png`;

  // Check it's either diff images generated by screenshot comparison, or the test image results
  if (dataType !== 'diff' && dataType !== 'test') {
    return;
  }

  return verifySecureToken(event).then(() => {
    let tempPath = `/tmp/${dataType}-${saveFilename}`;
    let filePath = `screenshots/${prNumber}/${dataType}/${saveFilename}`;
    let binaryData = new Buffer(data, 'base64').toString('binary');
    writeFileSync(tempPath, binaryData, 'binary');
    return bucket.upload(tempPath, {destination: filePath});
  });
}
