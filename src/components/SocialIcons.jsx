import React from 'react'

export const TwitterIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export const InstagramIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill={color === 'currentColor' ? 'none' : 'currentColor'} />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

export const LinkedinIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)

export const GithubIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
)

export const YoutubeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export const DribbbleIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.19 10.19 0 004.396-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.404a10.161 10.161 0 006.29 2.166c1.42 0 2.77-.29 4.006-.82zm-11.62-2.02c.29-.48 3.01-4.875 8.306-6.59.053-.017.104-.03.156-.047a28.51 28.51 0 00-.688-1.517c-5.104 1.528-10.064 1.465-10.512 1.457a10.204 10.204 0 002.738 6.697zM2.882 11.86c.457.006 4.732.032 9.51-1.252a88.32 88.32 0 00-3.817-5.882A10.19 10.19 0 002.882 11.86zm7.517-8.532c.194.26 2.305 3.176 3.855 5.948 3.674-1.377 5.227-3.465 5.414-3.726A10.137 10.137 0 0012 1.817c-1.093 0-2.145.176-3.108.5zm7.672 2.264c-.2.27-1.924 2.48-5.733 4.026a38.25 38.25 0 01.49 1.064l.169.397c3.39-.427 6.762.257 7.112.33a10.218 10.218 0 00-2.038-5.817z"/>
  </svg>
)

export const BehanceIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M22 17.002H15v1.233c0 .878.68 1.57 1.571 1.57h3.858c.89 0 1.571-.692 1.571-1.57v-1.233zM16.571 11h2.286c.891 0 1.571.692 1.571 1.571V14h-5.428v-1.429c0-.879.68-1.571 1.571-1.571zM8.568 13.916c0 .762-.572 1.39-1.332 1.39H4.148v-2.772h3.088c.76 0 1.332.628 1.332 1.382zm-.29-4.88c0 .694-.52 1.258-1.21 1.258H4.148V7.768h2.92c.69 0 1.21.564 1.21 1.268zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-2 2.059c0-2.868-2.062-4.908-5.143-4.908-3.08 0-5.143 2.04-5.143 4.908v.882c0 2.868 2.063 4.909 5.143 4.909 3.081 0 5.143-2.041 5.143-4.909v-.882zm-12 1.857c0-1.298-.69-2.286-2.086-2.585C9.31 12.87 10 11.892 10 10.73c0-2.261-1.857-3.73-4.444-3.73H1v13.998h4.556c2.587 0 4.444-1.469 4.444-3.73a3.42 3.42 0 0 0-.001-.21zm8.286-6.666h-5.429v1.43h5.429V9.25z"/>
  </svg>
)

export const FacebookIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
  </svg>
)

export const WhatsappIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export const DiscordIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0c-.172-.393-.412-.875-.63-1.25a.079.079 0 00-.078-.037 19.736 19.736 0 00-4.885 1.515.069.069 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
  </svg>
)

export const GoogleIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.527a5.99 5.99 0 0 1 5.99-5.99c2.455 0 4.48 1.554 5.21 3.738l3.96-1.54C21.735 4.887 18.21 2 13.99 2 8.163 2 3.437 6.727 3.437 12.554S8.163 23.11 13.99 23.11c5.776 0 10.435-4.167 10.435-10.285 0-.54-.055-1.08-.15-1.605H12.24z"/>
  </svg>
)

export const WebsiteIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const SpotifyIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.308c-.212.345-.664.457-1.008.243-2.783-1.702-6.286-2.087-10.413-1.144-.393.09-.792-.162-.882-.555-.09-.393.162-.792.555-.882 4.508-1.03 8.375-.595 11.5 1.316.345.212.457.664.243 1.008zm1.464-3.262c-.267.433-.833.574-1.266.307-3.187-1.958-8.046-2.525-11.815-1.382-.486.147-.997-.132-1.144-.618-.147-.486.132-.997.618-1.144 4.307-1.307 9.664-.672 13.315 1.572.433.267.574.833.307 1.266zm.126-3.41c-3.82-2.27-10.12-2.48-13.733-1.383-.586.178-1.205-.157-1.383-.743-.178-.586.157-1.205.743-1.383 4.167-1.265 11.13-1.01 15.545 1.614.526.312.7.992.388 1.518-.313.526-.992.7-1.518.388z"/>
  </svg>
)

export const getSocialIcon = (platform, size = 20, color = 'currentColor') => {
  const p = String(platform).toLowerCase().trim()
  if (p.includes('github')) return <GithubIcon size={size} color={color} />
  if (p.includes('twitter') || p.includes(' x ')) {
    // Check if it's literally x or includes twitter
    return <TwitterIcon size={size} color={color} />
  }
  if (p === 'x') return <TwitterIcon size={size} color={color} />
  if (p.includes('linkedin')) return <LinkedinIcon size={size} color={color} />
  if (p.includes('instagram')) return <InstagramIcon size={size} color={color} />
  if (p.includes('youtube')) return <YoutubeIcon size={size} color={color} />
  if (p.includes('dribbble')) return <DribbbleIcon size={size} color={color} />
  if (p.includes('behance')) return <BehanceIcon size={size} color={color} />
  if (p.includes('facebook')) return <FacebookIcon size={size} color={color} />
  if (p.includes('whatsapp')) return <WhatsappIcon size={size} color={color} />
  if (p.includes('discord')) return <DiscordIcon size={size} color={color} />
  if (p.includes('google')) return <GoogleIcon size={size} color={color} />
  if (p.includes('spotify')) return <SpotifyIcon size={size} color={color} />
  return <WebsiteIcon size={size} color={color} />
}

export const getSocialBrandColor = (platform) => {
  const p = String(platform).toLowerCase().trim()
  if (p.includes('github')) return '#24292F'
  if (p.includes('twitter') || p === 'x') return '#000000'
  if (p.includes('linkedin')) return '#0A66C2'
  if (p.includes('instagram')) return '#E1306C'
  if (p.includes('youtube')) return '#FF0000'
  if (p.includes('dribbble')) return '#EA4C89'
  if (p.includes('behance')) return '#0057FF'
  if (p.includes('facebook')) return '#1877F2'
  if (p.includes('whatsapp')) return '#25D366'
  if (p.includes('discord')) return '#5865F2'
  if (p.includes('google')) return '#EA4335'
  if (p.includes('spotify')) return '#1DB954'
  return '#3E66FB'
}
