angular.module('bhima.services')
.service('SnapshotService', SnapshotService);

SnapshotService.$inject = ['$uibModal', '$http'];

function SnapshotService($uibModal, $http) {

const service = this;
service.dataUriToFile = dataUriToFile;
service.openWebcamModal = openWebcamModal;

function openWebcamModal() {
  return $uibModal.open({
    templateUrl : 'modules/templates/bhSnapShot.html',
    controller : snapshotController,
    controllerAs : 'snapshotCtrl',
    backdrop     : 'static',
    animation    : false,
    size : 'lg',
  }).result;
}

// convert the data_url to a file object
function dataUriToFile(dataUri, fileName, mimeType) {
  return (
    $http.get(dataUri, { responseType : 'arraybuffer' })
      .then((res) => {
        return res.data;
      })
      .then((buf) => {
        return new File([buf], fileName, { type : mimeType });
      })
  );
}

return service;
}

// the controler for this service

angular.module('bhima.controllers').controller('snapshotController', snapshotController);

snapshotController.$inject = ['$uibModalInstance'];

function snapshotController($uibModalInstance) {
const vm = this;
let _video = null;
let patData = null;

vm.showDemos = false;
vm.mono = false;
vm.invert = false;
vm.hasDataUrl = false;

// Setup a channel to receive a video property
// with a reference to the video element
// See the HTML binding in main.html
vm.channel = {};

vm.webcamError = false;
vm.onError = function (err) {
  vm.webcamError = err;
};

vm.onSuccess = function () {
  // The video element contains the captured camera data
  _video = vm.channel.video;
  vm.patOpts = { x : 0, y : 0, w : _video.width, h : _video.height };
  vm.showDemos = true;

};

/**
 * Make a snapshot of the camera data and show it in another canvas.
 */
vm.makeSnapshot = function makeSnapshot() {

  if (!_video) { return; }

  const patCanvas = document.querySelector('#snapshot');
  if (!patCanvas) return;

  patCanvas.width = _video.width;
  patCanvas.height = _video.height;
  const ctxPat = patCanvas.getContext('2d');
  const idata = getVideoData(vm.patOpts.x, vm.patOpts.y, vm.patOpts.w, vm.patOpts.h);
  ctxPat.putImageData(idata, 0, 0);
  storeImageBase64(patCanvas.toDataURL());
  patData = idata;

};

/**
   * Redirect the browser to the URL given.
   * Used to download the image by passing a dataURL string
   */
vm.downloadSnapshot = function downloadSnapshot(dataURL) {
  window.location.href = dataURL;
};

var getVideoData = function getVideoData(x, y, w, h) {
  const hiddenCanvas = document.createElement('canvas');
  hiddenCanvas.width = _video.width;
  hiddenCanvas.height = _video.height;
  const ctx = hiddenCanvas.getContext('2d');
  ctx.drawImage(_video, 0, 0, _video.width, _video.height);
  return ctx.getImageData(x, y, w, h);
};

  /**
   * This function could be used to send the image data
   * to a backend server that expects base64 encoded images.
   *
   * In this example, we simply store it in the scope for display.
   */
var storeImageBase64 = function storeImageBase64(imgBase64) {
  vm.snapshotData = imgBase64;
  vm.hasDataUrl = true;
};

(function () {
  const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
                                  || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
}());

const start = Date.now();

/**
 * Apply a simple edge detection filter.
 */
function applyEffects(timestamp) {
  const progress = timestamp - start;

  if (!_video) { return; }
  const videoData = newFunction(getVideoData, _video);

  const resCanvas = document.querySelector('#result');

  if (!resCanvas) return;

  resCanvas.width = _video.width;
  resCanvas.height = _video.height;
  const ctxRes = resCanvas.getContext('2d');
  ctxRes.putImageData(videoData, 0, 0);
    // apply edge detection to video image
  Pixastic.process(resCanvas, "edges", { mono : vm.mono, invert : vm.invert });

  if (progress < 20000) {
    requestAnimationFrame(applyEffects);
  }
}

vm.getDataUrl = function () {

  $uibModalInstance.close(vm.snapshotData);
};

vm.closeModal = function () {
  $uibModalInstance.dismiss('cancel');
};
requestAnimationFrame(applyEffects);

}

function newFunction(getVideoData, _video) {
const videoData = getVideoData(0, 0, _video.width, _video.height);
return videoData;
}
