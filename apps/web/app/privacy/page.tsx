import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal';

export const metadata: Metadata = { title: 'Privacy — cmux concept', robots: { index: false } };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      body="This site is an independent concept redesign. It collects nothing: no analytics, no cookies, no forms and no third party scripts. The only network request it makes is a build time call to the public GitHub API to read the repository’s star count."
      realHref="https://cmux.com/privacy"
      realLabel="Read the real cmux privacy policy"
    />
  );
}
