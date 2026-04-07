import { gsap } from "gsap";

export default function CanvasAboutAnim (canvas){

//const canvas = document.querySelector('.canvas')
//let firstFrame = {frame: 0}

const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  render();
});
const framesCount =  24;
//const currentFrame = '../homePage/1.png' //(index) => `../homePage/${(index + 1).toString()}.png`;
const images = [];
const imageSeq = {
    frame: 0,
  };

  function currentFrame(index) {
    var data = `../homePage/1.png
  `

    return data.split('\n')[index];
  }


  for (let i = 0; i < framesCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    console.log(img.src)
    images.push(img);
  }
gsap.to(imageSeq, {
       duration: 1,
       frame: framesCount - 1,
       snap: "frame",
       ease: "none",
       onUpdate: render,
       ease: "none",
       repeat: -1
  })

  images[0].onload = render;

function render () {
    context.canvas.width = images[0].width;
    context.canvas.height = images[0].height;
    context.clearRect(0,0, canvas.width, canvas.height)
    context.drawImage(images[imageSeq.frame], 0, 0)
}


//png seq drawing 
//const context = canvas.getContext("2d");
//const framesCount =  24;
//const currentFrame = (index) => `../homePage/${(index + 1).toString()}.png`;
//const images = [];
//
//for(let i = 0 ; i < framesCount; i++){
//    const img = new Image();
//    img.src = currentFrame(i)
//    images.push(img)
//    console.log(img)
//}
//
//images[0].onload =  render;
//
//function render () {
//    context.canvas.width = images[0].width;
//    context.canvas.height = images[0].height;
//    context.clearRect(0,0, canvas.width, canvas.height)
//    context.drawImage(images[firstFrame.frame], 0, 0)
//}
//
//const tl = gsap.timeline();
//
//tl.to(firstFrame, {
//    duration: 1,
//    frame: framesCount - 1,
//    snap: "frame",
//    ease: "none",
//    onUpdate: render,
//    ease: "none",
//    repeat: -1
//});

}