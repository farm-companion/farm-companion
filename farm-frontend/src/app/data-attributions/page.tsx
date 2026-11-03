import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data & Image Attributions',
  description: 'Open-data and image source licences used by Farm Companion.',
}

export default function DataAttributionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 prose">
      <h1>Data &amp; Image Attributions</h1>
      <p>
        Farm Companion is built on open data. We credit our sources here in line
        with their licences.
      </p>
      <h2>Farm location data</h2>
      <ul>
        <li>
          Farm locations and tags &copy;{' '}
          <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{' '}
          contributors, available under the Open Database License (ODbL).
        </li>
        <li>
          Business verification and addresses from the{' '}
          <a href="https://www.food.gov.uk/">Food Standards Agency</a> Food
          Hygiene Rating data, under the Open Government Licence (OGL).
        </li>
        <li>
          Postcode geocoding by <a href="https://postcodes.io/">postcodes.io</a>{' '}
          (ONS/OS OpenData, OGL).
        </li>
      </ul>
      <h2>Imagery</h2>
      <p>
        Farm and county artwork is our own illustration, drawn to a house style
        by a text-to-image model and served from our own storage, so it carries
        no third-party licence.
      </p>
      <p>
        A photograph here is either licensed stock or published under an open
        licence. Credit is shown where the licence asks for it, and the
        photographer&apos;s name is kept with the file either way.
      </p>
    </main>
  )
}
