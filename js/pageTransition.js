import Highway from "@dogstudio/highway";
import { gsap } from "gsap";

class Fade extends Highway.Transition(){
    in({from, to , done}){
        const tl  = gsap.timeline({defaults: {ease:'power2.inOut'}})
        tl.fromTo(to,1,{opacity:1},{opacity:0})
        tl.fromTo('.swipe', 0.75, {x:'-100%'},{x:"0", onComplete: function(){ done() } })
    }
    Out({from, done}){
        const tl  = gsap.timeline({defaults: {ease:'power2.inOut'}})
        tl.fromTo('.swipe', 0.75, {x:'0'},{x:'100%',stagger:0.25, onComplete: function(){ done() }  })
        tl.fromTo(from ,1, {opacity:0},{opacity:1})
    }
}

export default Fade;