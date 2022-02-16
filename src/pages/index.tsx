import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser} from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Link from "next/link";
import { RichText } from "prismic-dom";
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  
  const { results, next_page } = postsPagination

  const [ posts, setPosts ] = useState<Post[]>(results);

  const [ nextPage, setNextPage ] = useState<string>(next_page);

  async function handleNextPage() {
    const data = await fetch(nextPage)
    .then(response => response.json());

    const { results, next_page } = data;

    setNextPage(next_page);

    results.map(post => (
      setPosts([...posts, {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }])
    ))
  }
  
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.logo}>
          <img src="/Logo.svg" alt='logo' />
        </div>

        {posts.map(post => (
          <div key={post.uid} className={styles.containerPost}>
            <Link href={`/post/${post.uid}`}>
              <a href=''>
                <h1>{post.data.title}</h1>
              </a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div className={commonStyles.info}>
              <span><FiCalendar /> {format(new Date(post.first_publication_date),"d MMM y", {locale: ptBR})}</span> 
              <span><FiUser /> {post.data.author}</span>
            </div>
          </div>
        ))}

        {nextPage &&
          <div className={styles.containerLink}>          
            <a onClick={handleNextPage}>Carregar mais posts</a>
          </div>
        }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type','posts'),
    {
      pageSize: 1
    }    
    
  );

  let { results: data, next_page } = postsResponse;

  const results = data.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results
      } 
    }
  }
};
