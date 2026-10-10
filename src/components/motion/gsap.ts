"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** Registrasi plugin sekali, di modul klien bersama. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);
}

export { Flip, gsap, Observer, ScrollTrigger, SplitText, useGSAP };
