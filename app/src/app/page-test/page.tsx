// src/app/page-test/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function PageTest() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/page');
  };

  return (
    <div>
      <h1>Page de test</h1>
      <button onClick={handleRedirect}>Aller à /page</button>
    </div>
  );
}
