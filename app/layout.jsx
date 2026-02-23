import '../styles/globals.css';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { GA4PageView } from '../components/ga4';
import Script from 'next/script';

export const metadata = {
    title: {
        template: '%s | OM Recipes',
        default: 'OM Recipes'
    }
};

export default function RootLayout({ children }) {
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

    return (
        // Some browser extensions (notably Google Tag Assistant) inject
        // `data-tag-assistant-*` attributes onto the <html> element before React
        // hydrates, which triggers a dev hydration warning.
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />

                {measurementId ? (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                              window.dataLayer = window.dataLayer || [];
                              function gtag(){dataLayer.push(arguments);}
                              window.gtag = window.gtag || gtag;
                              gtag('js', new Date());

                              // Disable automatic page_view so we can handle SPA navigation.
                              gtag('config', '${measurementId}', { send_page_view: false });
                            `}
                        </Script>
                    </>
                ) : null}
            </head>
            <body className="antialiased" suppressHydrationWarning>
                <GA4PageView measurementId={measurementId} />
                <div className="flex flex-col min-h-screen px-6 sm:px-12">
                    <div className="flex flex-col w-full grow">
                        <Header />
                        <main className="grow">{children}</main>
                        <Footer />
                    </div>
                </div>
            </body>
        </html>
    );
}
