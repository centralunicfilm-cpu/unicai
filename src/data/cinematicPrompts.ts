// Prompts cinematográficos adaptados de awesome-seedance (MIT) por ZeroLu.
// Fonte: https://github.com/ZeroLu/awesome-seedance
// Uso: biblioteca de inspiração — toque para copiar ou enviar ao Gerar Vídeo.
import { YOUMIND_PROMPTS } from "./youmindPrompts";

export interface CinematicPrompt {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  duration?: string;
  source: string;
  sourceUrl: string;
  videos: string[];
  poster?: string;
  target?: "video" | "image";
  thumbnail?: string;
  needsReference?: boolean;
}

const dur = (p: string): string | undefined => {
  const m = p.match(/Duration:\s*(\d+\s?s)/i) || p.match(/\[(\d+)\s*seconds?\]/i);
  return m ? m[1] : undefined;
};

const raw: Array<Omit<CinematicPrompt, "id" | "duration">> = [
  {
    category: `Cinematic Film Styles`,
    title: `1. Hollywood Professional Racing Movie Style`,
    description: `Le Mans-inspired cinematic racing scene with night rain and high stakes.`,
    prompt: `Style: Hollywood Professional Racing Movie (Le Mans Style), Cinematic Night, Rain, High Stakes Sport.
Duration: 15s.

[00-05s] Shot 1: The Veteran (Interior/Close-up).
Rain lashes the windshield of a high-tech race car on a track. The Veteran driver (in helmet) looks over, calm and focused. Dashboard lights reflect on his visor.
Dialogue Cue: He gives a subtle nod and mouths "Let's go."

[05-10s] Shot 2: The Challenger (Interior/Close-up).
Cut to the rival car next to him. The younger driver grips the wheel tight, breathing heavily. Eyes wide with adrenaline.
Dialogue Cue: He whispers "Focus" to himself.

[10-15s] Shot 3: The Green Light (Wide Action).
The starting lights turn Green. Both cars accelerate in perfect sync on the wet asphalt. Water sprays massively into the camera lens. Motion blur turns the stadium lights into long streaks of color.`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020515830874636716?s=20`,
    videos: ["https://github.com/user-attachments/assets/76ffff91-3b2b-47c4-953c-f9ff75834fe7"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-1.jpg",
  },
  {
    category: `Cinematic Film Styles`,
    title: `2. Denis Villeneuve Style Epic Desert Scene`,
    description: `Cinematic IMAX 70mm film style with epic scale and gritty realism.`,
    prompt: `Style: IMAX 70mm Film, Denis Villeneuve Style, Gritty Realism, Epic Scale, Desaturated.
Duration: 15s.
[00-05s] Extreme Wide Shot (The Scale). A colossal sandstorm, miles high, swallows a vast desert landscape. A tiny convoy of armored military vehicles races away from it. The scale of nature vs man is terrifying. Hans Zimmer style tension.
[05-10s] Cockpit Cam (The Panic). Inside the lead rover. The pilot screams "GO! GO!" (Subtitle: MAX POWER!). Camera shakes violently. Sand blasts the windshield. The sun is blocked out by the approaching wall of dust.
[10-15s] The Jump (The Climax). The rover hits a massive dune and launches into the air (Slow Motion). Silhouette against the dark storm. Lightning strikes within the dust cloud. Debris flies past the lens. Cut to black on impact.`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020794007291404726?s=20`,
    videos: ["https://github.com/user-attachments/assets/1ab84150-de21-4d8b-bf26-340676b4f066"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-2.jpg",
  },
  {
    category: `Cinematic Film Styles`,
    title: `3. Wong Kar-wai Film Style (Rainy Phone Booth Scene)`,
    description: `Creating a nostalgic Hong Kong art cinema atmosphere with retro film grain and emotional depth.`,
    prompt: `[Film Style]: 90s Hong Kong Art Cinema style, retro film feel, high ISO grain, ambiguous yellow-green tint, frame stepping effect, melancholic atmosphere.

[Core Dialogue (for emotion control)]: "If memories were canned food, I hope they never expire."

[Video Duration]: 10 seconds
[Script]:

[00:00-00:04] Shot 1: Through the Glass Peeping.
Scene: A rain-covered red public telephone booth.
Character: A man (or woman) in a khaki trench coat holding the receiver tightly, not speaking, just listening.
Emotional Performance: Through the glass refraction, see his/her eyes hollow yet deeply emotional. Rain flows down the glass, distorting his face like an oil painting.
Subtitle/Narrative sense: The picture seems frozen, only the sound of rain.

[00:04-00:07] Shot 2: Extreme Close-up & Micro-expression.
Scene: Focus on the character's lips and half face.
Action: He/She whispers softly into the receiver. Lips tremble slightly, seeming to want to say something but swallow it back.
Lighting: Street neon bokeh flows across his face, bright and dim alternately.
Dialogue Emotion Mapping: Shows the ultimate restraint and loneliness of "wanting to touch but drawing back".

[00:07-00:10] Shot 3: Signature Slow-shutter Drag Shadow.
Scene: Character hangs up phone, turns around and walks into the rainy crowd.
Visual Effect: Using frame stepping effect (stop-motion feel), the character's back becomes blurred with trailing shadows (motion blur), as if the soul stayed in place while only the body walks away.
Environment: Background is flowing city car lights forming elongated light trails.

[Technical Parameters]: Simulated handheld camera, shallow depth of field, color shift, emotionally intense.`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020415877993156966?s=20`,
    videos: ["https://github.com/user-attachments/assets/a3be2f7e-a30b-4c7e-847b-447d315f6afe"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-3.jpg",
  },
  {
    category: `Cinematic Film Styles`,
    title: `4. Replicate Blog: Blockbuster Prompt Pack`,
    description: `Large-scale cinematic set pieces collected from Replicate's Seedance 2.0 article.`,
    prompt: `A catastrophic collision between two massive space stations in low Earth orbit. Metal shears apart in slow motion as the stations grind into each other, sending a hailstorm of debris spiraling outward. Entire modules crumple like tin cans. Pressurized compartments blow out in violent bursts of crystallizing atmosphere. Solar panels shatter and cartwheel into the void. The camera tumbles through the wreckage as an astronaut ragdolls past, arms flailing. Explosions ripple down the station spine. Earth looms enormous in the background, serene and indifferent. Hyper-realistic, catastrophic scale, ISO debris field, 8k, Gravity collision sequence energy.`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Cinematic Film Styles`,
    title: `5. Replicate Blog: Time-Coded Cinematic Sequences`,
    description: `Three timestamped examples that show how to escalate shots across a full 15-second scene.`,
    prompt: `[0-4s]: Low-angle wide shot from ground level, static, a lone samurai silhouetted against a blood-red sunset on a windswept ridge, tall grass bending in the wind, the distant rumble of approaching thunder.
[4-8s]: Dolly zoom on the samurai’s face as realization hits — the background stretches and warps while the subject stays locked in frame, a Hitchcock vertigo effect, drums building.
[8-12s]: Whip pan to a sweeping crane shot rising above the ridge, revealing an army of a thousand torches advancing through the valley below, war horns blaring, smoke drifting across the landscape.
[12-15s]: Snap cut to extreme close-up, the samurai’s hand grips the katana hilt, knuckles white, a single drop of sweat falls in slow motion, the sound of a blade being drawn rings out, then dead silence. Hyper-realistic, 8k, Akira Kurosawa cinematography, Hans Zimmer sound design.`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Cinematic Film Styles`,
    title: `6. Jazz Pianist with Native Audio Sync`,
    description: `Performance prompt showing Seedance 2.0's synchronized instrument audio and camera pullback.`,
    prompt: `A close-up of a jazz pianist’s hands flying across the keys of a grand piano in a smoky nightclub. Each keystroke produces a visible ripple of warm amber light across the piano’s lacquered surface. The camera slowly pulls back to reveal the full band — upright bass, drums with brushes, a tenor saxophone. The musicians nod to each other, trading solos. Cigarette smoke curls through a single spotlight beam. Hyper-realistic, intimate jazz club atmosphere, 8k, the crisp attack of piano keys, walking bassline, brushed snare, breathy saxophone melody.`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Advertising & Commercial Branding`,
    title: `1. MUJI Brand Promotional Video`,
    description: `Pure prompt generation for a promotional video about the MUJI brand.`,
    prompt: `Help me generate a promotional video about the MUJI brand.`,
    source: `歸藏(guizang.ai) ([@op7418](https://x.com/op7418))`,
    sourceUrl: `https://x.com/op7418/status/2021260675960504802?s=20`,
    videos: ["https://github.com/user-attachments/assets/8ea42edb-d3c8-4fb8-8046-f59a3c1ddb1d"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-4.jpg",
  },
  {
    category: `Advertising & Commercial Branding`,
    title: `2. Perfume MG Animation Style`,
    description: `Using Seedance 2.0 for motion graphics animation instead of traditional AE.`,
    prompt: `Based on the script from Image 1, generate advertising content for the perfume product in Image 2. The voiceover should reference a natural female voice speaking in English. Pay attention to the proportions of the perfume bottle, integrating it into the background with natural lighting. Avoid heavy texture overlay and cutout effects. The pace can be more brisk.`,
    source: `Vicky ([@BFAVicky](https://x.com/BFAVicky))`,
    sourceUrl: `https://x.com/BFAVicky/status/2020267913316561195?s=20`,
    videos: ["https://github.com/user-attachments/assets/7c8e24b9-b203-417f-b18a-6a1611d7871a"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-5.jpg",
  },
  {
    category: `Advertising & Commercial Branding`,
    title: `3. Replicate Blog: Time-Coded Perfume Commercial`,
    description: `A luxury perfume ad broken into four controlled shots for product storytelling.`,
    prompt: `(0-3s) Macro shot of a luxury perfume bottle among scattered pink peonies, shallow depth of field, petals floating in warm afternoon light, soft ambient music.
(3-7s) Camera glides closer, a feminine hand enters frame from the right, fingers gently touch the glass bottle, the sound of silk rustling.
(7-12s) Hard cut to slow-motion spray, golden mist diffuses through the air, particles catching rim light against a dark background, the hiss of the atomizer.
(12-15s) Seamless pull-out to hero frame, product centered, volumetric lighting, minimal cream background, elegant silence. Hyper-realistic, 8k, fashion commercial cinematography.`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Social Media & Viral Memes`,
    title: `1. Giant Orange Cat Meme Style`,
    description: `Comedic surrealism featuring a Godzilla-sized orange cat in a Chinese city.`,
    prompt: `【Style】Mockumentary, mobile Vlog perspective, hyperrealistic CG combined with real scenes, 8K quality, perfect fur physics simulation.
【Duration】15 seconds
【Scene】Hongya Cave in Chongqing or a busy overpass intersection (with magical 8D city feel).
[00:00-00:05] Shot 1: Visual spectacle (The Reveal).
The scene shows a bustling city street. The camera lifts up to reveal a **Gozilla-sized orange tabby cat** stuck between two skyscrapers.
Action: The giant cat is stuck because it's too fat, waving its huge paws with a pitiful expression, trying to pull itself out.
Detail: Cat fur is clearly visible in the sunlight, huge paw pads pressing against glass curtain walls, deforming the glass.
[00:05-00:10] Shot 2: Absurd interaction (The Interaction).
The camera switches to ground-level perspective. Traffic flows on the street, traffic lights flashing. The giant cat lowers its head, bringing its huge cat face close to the ground, curiously sniffing a bus waiting at a red light.
Action: The bus driver calmly reaches out and pets the giant cat's nose. The cat sneezes, instantly blowing away roadside leaves and pedestrians' hats (wind effect).
[00:10-00:15] Shot 3: Memetic ending (The Punchline).
The giant cat finally squeezes past the buildings and sits down on a cross-river bridge, causing the bridge deck to sink slightly (physical feedback).
Narrative sense: It lazily lies down and starts grooming itself, blocking the entire evening rush hour traffic. The camera finally freezes on its innocent big eyes.`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020717903134204344?s=20`,
    videos: ["https://github.com/user-attachments/assets/2c0688fe-7733-4a20-8f1d-ec0d5c60527c"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-6.jpg",
  },
  {
    category: `Social Media & Viral Memes`,
    title: `2. Sourdough Pretzel Street Argument`,
    description: `An everyday dialogue scene with meme-ready text emphasis and clean lip-sync.`,
    prompt: `A tight medium shot of two eccentric adults in typical, everyday clothing—one in a slightly oversized trench coat, the other in a weathered denim jacket—deep in a heated, animated conversation on a rainy West Village street corner. The one in the trench coat gestures wildly, the words “SOURDOUGH PRETZEL” appearing in pulsating electric blue: “It’s not just a pretzel, Arthur! It’s a sourdough pretzel!” The second guy says ‘Who cares. A pretzel’s a pretzel!’`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `UGC Style`,
    title: `1. Surrealistic Documentary Style`,
    description: `Reality-bending vlog with a twist on mirror reflections.`,
    prompt: `【Style】Mockumentary (Vlog Style), hyperrealism, fixed-camera real-shot feel, natural lighting, with a slight suspenseful comedy tone.
【Duration】15 seconds
【Main Character】An ordinary young beautiful woman, in front of the bathroom sink at home.
[00:00-00:06] Shot 1: Daily setup (Normalcy).
Scene: In front of a regular bathroom mirror.
Action: The protagonist is brushing her teeth, mouth full of foam. She makes various funny faces (squinting, eyebrow-wiggling) at the mirror while brushing her teeth.
Key detail: At this point, the reflection in the mirror is completely normal, movements synchronized.
[00:06-00:11] Shot 2: BUG appears (The Glitch).
Action: After brushing teeth, the protagonist lowers her head to spit out foam, then turns around to leave the bathroom.
High-impact moment (core climax): Just as the protagonist's real body has turned and left the mirror frame, the "reflection" in the mirror **doesn't move**! That "reflection" still maintains the tooth-brushing pose, even mischievously raising eyebrows at the camera with a bad smile, staying for a full 2 seconds, before suddenly panicking and "fast-forwarding" to catch up with the original body's movements before disappearing.
Director's note: Must create an extremely realistic "network delay" feel, as if the reflection has independent consciousness.
[00:11-00:15] Shot 3: Comedic callback (The Punchline).
Action: The protagonist, who has already walked to the door, seems to sense something is wrong, suddenly turning back to look at the mirror.
Result: The mirror has now completely returned to normal, completely empty, only reflecting the opposite wall. The protagonist scratches her head in confusion, showing a life-questioning expression toward the camera. The frame freezes on the protagonist's confused face (comedy effect).`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020788951678607813?s=20`,
    videos: ["https://github.com/user-attachments/assets/74c700e7-9371-4c1c-becf-ca3f9aadb357"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-7.jpg",
  },
  {
    category: `UGC Style`,
    title: `2. Reference Character in an Interior with Audio`,
    description: `A reference-driven setup that places a styled character into a photoreal interior and makes them speak supplied audio.`,
    prompt: `[Image2] is in the interior of [Image1] where he is kept the style of [Image2], but the realism of [Image1] remains. He says [Audio1].`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Short-form Drama & Web Series`,
    title: `1. Chinese New Year Gala Style: Zhen Huan & Hu Fei Show`,
    description: `A 10-second stage performance with contrasting historical formality and modern workplace humor.`,
    prompt: `10 second Chinese New Year Gala style stage performance: "Zhen Huan & Hu Fei Talk Show"

0–2 seconds:
Medium two-shot.
Stage overall is "living room sketch" setting, but surrounded by grandiose New Year red-gold LED screens.
Zhen Huan (left) and Hu Fei (right) sit side-by-side on a modern talk show sofa.
 Key historical accuracy requirement: Both are dressed in magnificent, clearly distinct Qing Dynasty court robes with standing collars, intricate embroidery; hairstyles are authentic "big pull horns" or "dot heads" with tassel decorations.
Hu Fei appears casual, holding a pickled cucumber to bite, fingers wearing long golden nail guards (finger guards).

2–4 seconds:
Shot switches to over-the-shoulder (OTS), perspective on Hu Fei.
Hu Fei exaggerates eye-rolling (classic "eye roll" expression).
She holds a pickle with her long nail guards while pointing and gesturing, speaking with an arrogant tone (lip-sync):
"This year's KPI is beating these little devils again, what aesthetic does that old man emperor know?"

4–6 seconds:
Quickly switch to Zhen Huan's over-the-shoulder shot (OTS).
 Contrasting detail: Zhen Huan wears a modern white Bluetooth earphone on one ear (strong contrast with ancient jewelry), holding a thin tablet computer sliding with her hand.
She responds calmly, professionally (lip-sync):
"Sister don't be angry, this is called workplace involution. I'm thinking of quitting to sell 'Truth Serum' (healing balm)."

6–8 seconds:
Close-up shot on the coffee table between the two.
A modern plastic pearl milk tea cup with "One Red Stripe" (a famous punishment from the drama) printed on it sits next to a traditional porcelain vase.
Lens quickly swings back to the two.

8–10 seconds:
Full stage panorama.
Audience laughter effect (presented through lighting changes/gap lights).
Hu Fei poses for the final freeze: leg crossed, chin lifted, eye-rolling again.
Zhen Huan smiles professionally toward the camera like a news anchor.
Golden confetti falls from the air.
Festival red atmosphere reaches its peak.
Style and atmosphere:

**Visuals:** High saturation New Year red and gold tones
**Costumes:** Museum-grade Qing Dynasty court attire (silk, fine embroidery, heavy headwear)
**Core contrast:** Formal Qing court protocol × Relaxing workplace/sketch performer attitude
**Cinematography:** Sharp rhythm, clear comedy points, sketch-style editing
**Aspect ratio:** 16:9`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020027994429911370?s=20`,
    videos: ["https://github.com/user-attachments/assets/76a2b32a-a7c7-42f7-af08-ea7ddcf3fed9"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-8.jpg",
  },
  {
    category: `Short-form Drama & Web Series`,
    title: `2. Chinese Mini-Drama Style (Rainy Night Emotional Scene)`,
    description: `Intense emotional drama with fast-paced editing and dramatic rain setting.`,
    prompt: `【Style】Popular Chinese web drama style (Mini-Drama Style), extreme fast-cut rhythm, high attractiveness filter, emotional outburst, romantic and heart-wrenching rainy night.
【Duration】15 seconds
【Characters】Deeply affectionate tycoon male lead (black coat, wet hair, red-rimmed eyes) VS stubbornly broken-hearted female lead (white dress, face full of tears).
[00:00-00:05] Shot 1: Rapid cut combination (Rapid Cuts).
Rainy street. Female lead decisively turns to leave (back view). Male lead rushes up and grabs her wrist (close-up). Female lead suddenly turns back, eyes showing pain filled with love and hate.
【Dialogue lip-sync guidance】Female lead cries out: "Let go! We're done!"
[00:05-00:10] Shot 2: Truth explosion (Intense Close-ups).
Male lead refuses to let go, rainwater streaming down both their faces. Male lead urgently pulls out a ring (or a document) from his chest, raises it in front of her, fingers trembling.
【Dialogue lip-sync guidance】Male lead shouts: "Look carefully! I never deceived you!"
[00:10-00:15] Shot 3: Emotional dam burst (Climax).
At the moment the female lead sees the object in her hand, her pupils shake (extreme close-up), covers her mouth, defenses collapse. The next second, the male lead suddenly pulls her into his arms and holds her tightly, as if trying to merge her into his bones. The camera quickly rotates and circles around the two embracing.
【Dialogue lip-sync guidance】Female lead sobs with her head down (silent/whimpering).`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020687040853975223?s=20`,
    videos: [],
  },
  {
    category: `Short-form Drama & Web Series`,
    title: `3. Chinese Viral CEO Drama Style (Vertical Format)`,
    description: `Viral short-form content with dramatic plot twists in vertical format.`,
    prompt: `【Style】Popular Chinese rich-tycoon (爽剧/Satisfying Drama) (Viral CEO Drama), vertical composition (Portrait Mode), high saturation filter, extreme facial close-ups, dramatic emotional range.
【Duration】15 seconds
【Characters】Humiliated groom (wearing cheap suit, eyes showing suppressed anger) VS disdainful mother-in-law (covered in jewelry, looking disgusted).
[00:00-00:05] Shot 1: Extreme humiliation (Humiliation).
Luxurious wedding venue. The mother-in-law slams a "divorce paper" onto the male lead's chest in front of everyone, surrounding guests burst into laughter.
【Action】Mother-in-law pokes her finger at the male lead's forehead.
【Dialogue lip-sync guidance】"Want to marry my daughter without a car or house? Take this hundred bucks and scram!"
[00:05-00:10] Shot 2: Sudden reversal (The Turn).
Male lead suddenly smirks and tears the divorce paper. At this moment, a massive helicopter sound (audio effect) drowns out the entire venue, the wind wildly messes up the mother-in-law's hair.
【Action】Male lead adjusts his collar, his aura instantly becomes domineering.
【Dialogue lip-sync guidance】"This marriage is what you want to cancel."
[00:10-00:15] Shot 3: Rich tycoon reveal (The Reveal).
The main door is kicked open, two rows of black-clad bodyguards rush in, kneeling on one knee to roll out a red carpet. An elderly butler tremblingly holds up a yellow robe (or ultimate black card) and runs to deeply bow in front of the male lead. The mother-in-law is so scared she collapses to the ground, her pupils shaking.
【Dialogue lip-sync guidance】The butler shouts: "Welcome back, Dragon King (Young Master)! Family assets have been unfrozen!"`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020688711172620665?s=20`,
    videos: ["https://github.com/user-attachments/assets/510355c2-6c53-4587-8f1a-9913a0a54bbb"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-9.jpg",
  },
  {
    category: `Visual Effects & Experimental Styles`,
    title: `1. Surrealism and Megalophobia Style`,
    description: `Reality-bending sky-zipper concept with God-like hands and cyberpunk world.`,
    prompt: `【Style】Surrealism, megalophobia, epic visual spectacle, Hollywood special effects quality, extremely realistic lighting and shadow rendering.
【Duration】15 seconds
【Scene】Above a clear city skyline, or an open wheat field.
[00:00-00:05] Shot 1: Calm illusion (The Calm).
The scene shows a cloudless, absolutely beautiful blue sky, sunny and bright, with birds flying by. The camera slowly tilts upward, giving a feeling of peaceful times.
Key detail: Suddenly, a giant, silver metallic gleam appears in the sky—it's a **"zipper"** spanning across the horizon.
[00:05-00:10] Shot 2: Unzipping the zipper (The Unzipping).
A **giant, translucent God's hand** grasps the zipper pull, slowly unzipping the blue sky with a tremendous roar (audio effect).
Action: As the zipper opens, the "blue sky" wrinkles and falls like fabric.
Visual spectacle: Behind the zipper is **not the universe**, but a **cyberpunk future world filled with neon lights, flying cars, and giant mechanical structures** (or a giant mechanical eye staring at us).
[00:10-00:15] Shot 3: Gaze between two worlds (The Revelation).
Only a corner of blue sky remains hanging in the sky. It turns out our living world was just an "eco-box" covered up.
Ending: The camera rapidly pulls back to reveal that our entire world (city/wheat field) is actually just a **glass miniature landscape ball** on a giant's table. The giant is leaning in close to observe us.`,
    source: `John ([@johnAGI168](https://x.com/johnAGI168))`,
    sourceUrl: `https://x.com/johnAGI168/status/2020727853281628276?s=20`,
    videos: ["https://github.com/user-attachments/assets/ccf43991-7f39-4550-8845-4aff2cec3ed4"],
    poster: "https://unicfilm-relay.central-unicfilm.workers.dev/img/posters/cp-10.jpg",
  },
  {
    category: `Visual Effects & Experimental Styles`,
    title: `2. Fluid Morphs Between Reference Photos`,
    description: `A minimal prompt that turns multiple images into one seamless motion sequence.`,
    prompt: `Create fluid morphs between all of the photos`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Visual Effects & Experimental Styles`,
    title: `3. Orbital Collision Physics Study`,
    description: `A variation of the space-station crash prompt that emphasizes debris logic and ragdoll motion.`,
    prompt: `A catastrophic collision between two massive space stations in low Earth orbit. Metal shears apart in slow motion as the stations grind into each other, sending a hailstorm of debris spiraling outward. Entire modules crumple like tin cans. Pressurized compartments blow out in violent bursts of crystallizing atmosphere. Solar panels shatter and cartwheel into the void. The camera tumbles through the wreckage as an isolated astronaut in a white EVA suit ragdolls past, arms flailing helplessly. Explosions ripple down the station’s spine. Earth looms enormous in the background, serene and indifferent. Hyper-realistic, catastrophic scale, orbital debris field, 8k, Gravity collision sequence energy.`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
  {
    category: `Visual Effects & Experimental Styles`,
    title: `4. Image-to-Video Physics Animation`,
    description: `Two simple \`Animate this image\` examples that show physical motion in realistic and stylized scenes.`,
    prompt: `Animate this image`,
    source: `Replicate Blog - How to make remarkable videos with Seedance 2.0*`,
    sourceUrl: `https://replicate.com/blog/seedance-2`,
    videos: [],
  },
];

const extra: CinematicPrompt[] = [
  {
    id: "cp-thumb-1",
    category: `Thumbnails & Produto`,
    title: `Capa social vertical 9:16`,
    description: `Template de capa para Reels/TikTok/Shorts com espaço livre no topo para o título.`,
    prompt: `[1 pessoa / 1 objeto] centralizado nos dois terços inferiores do quadro, [fundo forte da marca — gradiente marcante / bloco de cor / cena mínima], [clima de luz — lateral dramática / softbox de estúdio / neon rim-light], alto contraste, cores saturadas e marcantes, terço superior intencionalmente limpo para overlay do título, composição vertical 9:16 para thumbnail de rede social, legível em tamanho pequeno.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
  {
    id: "cp-thumb-2",
    category: `Thumbnails & Produto`,
    title: `Variação foto-realista`,
    description: `Direção alternativa: assunto real, luz real — par da capa social.`,
    prompt: `Foto realista de [assunto], luz natural do mundo real, fundo [bloco de cor / cena mínima], alto contraste, cores marcantes, terço superior limpo para título, vertical 9:16, fotografia comercial nítida.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
  {
    id: "cp-thumb-3",
    category: `Thumbnails & Produto`,
    title: `Variação ilustração estilizada`,
    description: `Direção alternativa: vetor / flat / estilo pôster.`,
    prompt: `Ilustração estilo pôster de [assunto], formas vetoriais chapadas, paleta marcante de [cores], fundo em bloco de cor com leve gradiente, alto contraste, terço superior limpo para título, vertical 9:16, design gráfico moderno.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
  {
    id: "cp-thumb-4",
    category: `Thumbnails & Produto`,
    title: `Variação tipográfica`,
    description: `Direção alternativa: texto gigante como protagonista da capa.`,
    prompt: `Composição tipográfica marcante com a palavra "[PALAVRA]" gigante como protagonista, fundo [cor sólida / gradiente], letras com volume e sombra suave, alto contraste, elementos gráficos mínimos de apoio, vertical 9:16, design de capa impactante.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
  {
    id: "cp-prod-1",
    category: `Thumbnails & Produto`,
    title: `Produto em cena lifestyle`,
    description: `Foto editorial de produto em contexto natural, luz de golden hour.`,
    prompt: `[produto com descrição a partir da referência], posicionado em [contexto natural adequado ao produto], luz suave de golden hour vindo do canto superior esquerdo, profundidade de campo rasa, fotografia editorial lifestyle, composição horizontal 4:3.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
  {
    id: "cp-prod-2",
    category: `Thumbnails & Produto`,
    title: `Macro detalhe de produto`,
    description: `Close extremo na textura/material para comercial de produto.`,
    prompt: `Close-up macro extremo de [produto] mostrando [material — textura / acabamento / translucidez], iluminação dramática lateral de estúdio, foco nítido na textura, quadro quadrado 1:1, fotografia comercial de produto.`,
    source: `MeiGen-AI-Design-MCP (MIT) por jau123`,
    sourceUrl: `https://github.com/jau123/MeiGen-AI-Design-MCP`,
    videos: [],
    target: "image",
  },
];

export const CINEMATIC_PROMPTS: CinematicPrompt[] = [
  ...extra,
  ...raw.map((item, index) => ({
    ...item,
    id: `cp-${index + 1}`,
    duration: dur(item.prompt),
  })),
];

export const CINEMATIC_PROMPTS_ALL: CinematicPrompt[] = [
  ...CINEMATIC_PROMPTS,
  ...YOUMIND_PROMPTS,
];

export const PROMPT_CATEGORIES: string[] = [...new Set(CINEMATIC_PROMPTS.map((p) => p.category))];
