// Sample wording used by ready-made sections and templates.
//
// The editor needs to know which texts are still samples so it can guide the
// owner to replace them ("Make it yours") and warn before publishing. Section
// factories take their wording from here, so the list cannot drift from what
// is actually inserted.

/** Wording an owner can reasonably keep (ordinary section headings and labels). */
export const S={
  featuresHeading:'What we offer',
  testimonialsHeading:'What customers say',
  pricingHeading:'Simple pricing',
  planNames:['Basic','Standard','Premium'],
  faqHeading:'Questions and answers',
  faqQuestions:['What are your opening hours?','Where are you located?','How can I place an order?'],
  ctaHeading:'Ready to get started?',
  contactHeading:'Get in touch',
  contactCopy:'Send us a message and we will reply as soon as we can.',
  aboutHeading:'About us',
  galleryHeading:'Our work',
} as const

/** Instructions written for the owner. Visitors should never see these. */
export const P={
  brand:'Your business',
  heroHeading:'A clear headline about what you offer',
  heroCopy:'Say who you help and what makes you different in one or two sentences.',
  featureTitles:['Your first service','Your second service','Your third service'],
  featureCopy:'Describe this service in a sentence or two.',
  testimonialQuote:'“Replace this with a real customer review.”',
  planPrice:'Add your price',
  planCopy:'List what is included in this plan.',
  faqAnswer:'Write the answer here.',
  ctaCopy:'Tell visitors what to do next and why it is worth it.',
  aboutCopy:'Tell your story: who you are, how you started and what customers can expect from you.',
  footerCopy:'© '+new Date().getFullYear()+' Your business. All rights reserved.',
  newPageCopy:'Add a short introduction to this page.',
  paragraph:'Write your text here.',
  heading:'Your heading',
  quote:'A memorable quote goes here.',
} as const

/** Sample wording from earlier versions that existing drafts may still contain. */
const legacy=[
  'Build something remarkable.',
  'This page is rendered from a clean JSON node tree inside an isolated iframe canvas.',
  'Design and launch a responsive website visually, without giving up control of the underlying structure.',
  'Everything you need to build.',
  'Use precise visual controls while keeping the site structure clean.',
  'Loved by teams who care about craft',
  '“Fast, flexible, and clear.”',
  '“We finally control every breakpoint.”',
  'Can I customize every breakpoint?','Can I export my code?','Can I reuse components?',
  'Yes. Edit this answer directly in the builder.',
  'Ready to build?',
  'Start with a strong structure and refine every detail visually.',
  '$29 / month',
  'Your business deserves a strong first impression.',
  'Introduce your services, explain what makes your business different, and give visitors a clear next step.',
  'We create work that moves people.',
  'A considered home for independent studios, agencies, and creative brands. Show the work behind your reputation.',
  'WELCOME TO YOUR NEXT CHAPTER','CREATIVE STUDIO · EST. 2026',
  'YOUR COMPANY','STUDIO / NAME','CoBest Site','Brand',
  'Introduce your core products or services in a few clear sentences.',
  'Explain what makes working with your team easy and effective.',
  'Give customers a practical reason to trust your business.',
  'Share the ideas and research that shape each project.',
  'Highlight the care and craft behind your best work.',
  'Show how your team turns vision into real-world results.',
  'Replace this with a genuine client testimonial.',
  'Tell people how to reach your team, then replace this sample contact address with your own.',
  'Heading','Paragraph','Rich text content',
]

const normalize=(text:string)=>text.trim().replace(/\s+/g,' ').toLowerCase()

const samples=new Set<string>()
for(const value of Object.values(P)){
  if(typeof value==='string')samples.add(normalize(value))
  else for(const item of value)samples.add(normalize(item))
}
for(const value of legacy)samples.add(normalize(value))

/** True when the text is unchanged sample wording that visitors should not see. */
export function isSampleText(text:string|undefined|null){
  const value=normalize(String(text||''))
  if(!value)return false
  if(samples.has(value))return true
  // The copyright line carries the current year.
  if(/^© \d{4} your (business|company)\b/.test(value))return true
  if(/^lorem ipsum\b/.test(value))return true
  return false
}

/** Stock photos that ship with ready-made sections. */
export const samplePhotos={
  placeholder:'photo-1494438639946-1ebd1d20bf85',
  about:'photo-1556761175-5973dc0f32e7',
  gallery:['photo-1497366216548-37526070297c','photo-1497215728101-856f4ea42174','photo-1524758631624-e2822e304c36'],
  background:'photo-1497366811353-6870744d04b2',
} as const
const photoIds=[samplePhotos.placeholder,samplePhotos.about,...samplePhotos.gallery,samplePhotos.background]
export const samplePhotoUrl=(id:string,width=1200)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`

/** True when a picture is still one of the stock photos. */
export const isSampleImage=(src:string|undefined|null)=>{
  const value=String(src||'')
  return photoIds.some(id=>value.includes(id))
}

/** Sample contact details that must never be published as-is. */
export const isSampleAddress=(href:string|undefined|null)=>/^mailto:hello@example\.com$/i.test(String(href||'').trim())
