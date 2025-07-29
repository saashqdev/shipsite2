// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres';

import sharp from 'sharp';
import path from 'path';
import { buildConfig, PayloadRequest } from 'payload';
import { fileURLToPath } from 'url';

import { Categories } from './collections/Categories';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Posts } from './collections/Posts';
import { User } from './collections/User';
import { Admins } from './collections/Admins';
import { Products } from './collections/Products';

import { Footer } from './globals/Footer/config';
import { Header } from './globals/Header/config';

import { plugins } from './plugins';
import { defaultLexical } from '@/fields/defaultLexical';
import { getServerSideURL } from './utilities/getURL';
import brevoAdapter from './utilities/brevoAdapter';
import { seed } from './endpoints/seed';

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    meta: {
      icons: [
        {
          rel: 'icon',
          type: 'image/png',
          url: '/favicon.ico',
        },
      ]
    },
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      graphics: {
        Logo: '@/components/AdminLogo',
        Icon: '@/components/AdminLogo'
      }
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Admins.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  email: brevoAdapter(),
  editor: defaultLexical,
  db: postgresAdapter({
    disableCreateDatabase: false,
    pool: {
      connectionString: process.env.DATABASE_URI
    },
  }),
  collections: [Pages, Posts, Media, Categories, User, Admins, Products],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user?.collection == "admins") return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  // DELETE THIS CODE AFTER SEEDING
  onInit: async (payload) => {
    try {
      const existingAdmins = await payload.find({
        collection: 'admins',
        limit: 1,
      })

      if (existingAdmins.totalDocs === 0) {
        await seed({ payload })
      }
    } catch (err) {
      console.error('Error during onInit seeding:', err)
    }
  },
})
