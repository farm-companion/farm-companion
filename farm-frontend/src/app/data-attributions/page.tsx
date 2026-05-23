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
      <h2>Photography</h2>
      <ul>
        <li>
          Some place photographs are sourced from{' '}
          <a href="https://www.geograph.org.uk/">Geograph Britain and Ireland</a>{' '}
          under CC BY-SA 2.0; the photographer is credited on each image.
        </li>
        <li>
          Some photographs are sourced from{' '}
          <a href="https://commons.wikimedia.org/">Wikimedia Commons</a> under
          their respective Creative Commons or public-domain licences, credited
          per image.
        </li>
      </ul>
    </main>
  )
}
