import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import PrismicDOM, { RichText } from "prismic-dom";
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter();
  
  let list: string[] = [];
  post.data.content.map((text) => {
    const newListHeading = text.heading.split(/\W/) 
    const newListBody = RichText.asText(text.body).split(/\W/);
    newListHeading.map(item => list.push(item));
    newListBody.map(item => list.push(item));
    return list;
  });

  let postAlt = {
    ...post,
    time: Math.round((list.length/200)),
  }

  //time_learnig: ,

  return (
    
    <>
      {router.isFallback ? (
        <p>Carregando...</p>
      ) : (
        <>
          <Head>
            <title>{post.data.title}</title>
          </Head>
          <Header />
          <div className={styles.banner}>
            <img src={postAlt.data.banner.url} alt="banner"/>
          </div>
          <main className={commonStyles.container}>
            <h1 className={styles.title}>{postAlt.data.title}</h1>
            <div className={commonStyles.info}>
              <span><FiCalendar /> {format(new Date(postAlt.first_publication_date),"d MMM y", {locale: ptBR})}</span> 
              <span><FiUser /> {postAlt.data.author}</span>
              <span><FiClock /> {postAlt.time} min</span> 
            </div>
            {postAlt.data.content.map(item => (
              <div key={item.heading} className={styles.content}>
                <h2>{item.heading}</h2>
                {item.body.map(itemBody => (
                  <div key={itemBody.text.length}  
                    dangerouslySetInnerHTML={{ __html: itemBody.text }}
                  />
                ))}
              </div>
            ))}
          </main>
        </>          
      )
      }
    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type','posts'),
    {
      pageSize: 1
    } 
  );

  let { results } = posts;

  const newPatchs = results.map(result => (
    {
      params: {
        slug: result.uid
      }
    }
  ));

  return {
    paths: newPatchs,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const { data, first_publication_date, uid } = response;

  const newContent = data.content.map(item => {
    const bd = item.body.map(ib => ib);

    return {
      heading: item.heading,
      body: bd
    }
  });

  return {
    props: {
      post: {
        uid,
        first_publication_date,
        data: {
          title: data.title,
          subtitle: data.subtitle,
          banner: {
            url: data.banner.url,
          },
          author: data.author,
          content: newContent,
        }, 
        
      }
    }
  }
};
