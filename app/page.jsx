import { redirect } from 'next/navigation';

// Immediately redirect from "/" to "/recipes"
export default function Home() {
  redirect('/recipes');
  return null;
}
