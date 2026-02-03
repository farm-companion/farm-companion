import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submission Successful | Farm Companion',
  description: 'Your farm shop has been submitted to Farm Companion. We will review your submission within 2-3 business days.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SubmissionSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
