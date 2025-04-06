// pages/results.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Results() {
  const router = useRouter();
  const { query } = router.query;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Something went wrong.');
        }
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div style={styles.container}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2>Error: {error}</h2>
        <Link href="/">
          <a style={styles.link}>Go Back</a>
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Results for "{query}"</h1>
      <section style={styles.section}>
        <h2>Summary</h2>
        <p>{result.Summary}</p>
      </section>

      <section style={styles.section}>
        <h2>Details</h2>
        {result.Details.map((detail, index) => (
          <div key={index} style={styles.detailItem}>
            {detail.Detail && <p>{detail.Detail}</p>}
            {detail['Images related to'] && (
              <div>
                <h3>{detail['Images related to']}</h3>
                <div style={styles.imagesContainer}>
                  {detail.Images.map((img, idx) => (
                    <a href={img.Link} key={idx} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img['Image URL']}
                        alt={detail['Images related to']}
                        style={styles.image}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <Link href="/">
        <a style={styles.link}>Search Again</a>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
  },
  section: {
    marginBottom: '30px',
  },
  detailItem: {
    marginBottom: '20px',
  },
  imagesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
  },
  image: {
    width: '150px',
    height: 'auto',
    objectFit: 'cover',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  link: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#0070f3',
    color: '#ffffff',
    borderRadius: '5px',
    textDecoration: 'none',
  },
};
          
