import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal';

export const metadata: Metadata = { title: 'Terms — cmux concept', robots: { index: false } };

export default function Terms() {
  return (
    <LegalPage
      title="Terms"
      body="There is nothing to agree to here. This page exists because a product site should not link to a page that does not resolve, and because inventing legal text on behalf of a company you do not work for would be worse than admitting the slot is a placeholder."
      realHref="https://cmux.com/terms"
      realLabel="Read the real cmux terms of service"
    />
  );
}
