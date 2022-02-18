import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from "next/link";
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';
import { RichText } from "prismic-dom";
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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

interface  NextPost {
  uid: string;
  title: string;
}

interface  PreviousPost {
  uid: string;
  title: string;
}

interface PostProps {
  post: Post;
  preview;
  next_post?: NextPost;
  previous_post?: PreviousPost; 
}

export default function Post({ post, preview, next_post, previous_post }: PostProps) {

  const router = useRouter();
  
  let list: string[] = [];
  post.data.content.map((text) => {
    const newListBody = RichText.asText(text.body).split(/\W/);
    newListBody.map(item => list.push(item));
    return list;
  });

  let postAlt = {
    ...post,
    time: Math.round((list.length/200)),
  }

  return (
    
    <>
      {router.isFallback ? (
        <p>Carregando...</p>
      ) : (
        <>
          <Head>
            <title>{RichText.asText(postAlt.data.title)}</title>
          </Head>
          <Header />
          <div className={styles.banner}>
            <img src={postAlt.data.banner.url} alt="banner"/>
          </div>
          <main className={commonStyles.container}>
            <h1 className={styles.title}>{RichText.asText(postAlt.data.title)}</h1>
            <div className={commonStyles.info}>
              <span><FiCalendar /> {format(new Date(postAlt.first_publication_date),"d MMM y", {locale: ptBR})}</span> 
              <span><FiUser /> {RichText.asText(postAlt.data.author)}</span>
              <span><FiClock /> {postAlt.time} min</span> 
            </div>
            {post.last_publication_date && (
              <div className={styles.postEdit}>
                <span>{`* editado em ${format(new Date(postAlt.last_publication_date),"d MMM y", {locale: ptBR})}, às ${format(new Date(postAlt.last_publication_date),"h:mm a", {locale: ptBR})} `}</span>
              </div>
            )}

            {postAlt.data.content.map(item => (
              <div key={item.heading} className={styles.content}>
                <h2>{RichText.asText(item.heading)}</h2>
                {item.body.map(itemBody => (
                  <div key={itemBody.text}
                    dangerouslySetInnerHTML={{ __html: itemBody.text }}
                  />
                ))}
              </div>
            ))}
            <hr />

            <div className={styles.linkPosts}>
              {previous_post && (
                <div>
                  <p>{RichText.asText(previous_post.title)}</p>
                  <Link href={`/post/${previous_post.uid}`} >
                    <a>Post Anterior</a>
                  </Link>
                </div>
              )}

              <div className={styles.linkLeft}>
                {next_post && (
                  <>
                    <p>{RichText.asText(next_post.title)}</p>
                    <Link href={`/post/${next_post.uid}`} >
                      <a href=''>Próximo post</a>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <Comments />


            {preview && (
              <aside className={commonStyles.preview}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}

          </main>
        </>          
      )
      }
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData
}) => {
  let uidNext: string;
  let titleNext: string;
  let uidPreview: string;
  let titlePreview: string;
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), { ref: previewData?.ref ?? null  });
  const { data, first_publication_date, last_publication_date, uid, id } = response;
  
  const nextpost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')], 
    { 
      pageSize : 1 , 
      orderings: '[document.first_publication_date]',
      after : id, 
    });
  const previewPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')], 
    { 
      pageSize : 1 , 
      after : id, 
      orderings: '[document.first_publication_date desc]' 
    });

  const { results } = nextpost;

  const { results: resultsPreview } = previewPost;

  results && results.find((next) => {    
    uidNext= next.uid;
    titleNext= next.data.title;    
  })

  resultsPreview && resultsPreview.find((preview) => {    
    uidPreview= preview.uid;
    titlePreview= preview.data.title;    
  })

  const newContent = data.content.map(item => {
    const bd = item.body.map(ib => ib);

    return {
      heading: item.heading,
      body: bd
    }
  });

  console.log(last_publication_date);

  return {
    props: {
      post: {
        uid,
        first_publication_date,
        last_publication_date: last_publication_date !== ''? last_publication_date: null,
        data: {
          title: data.title,
          subtitle: data.subtitle,
          banner: {
            url: data.banner.url,
          },
          author: data.author,
          content: newContent,
        },         
      },
      next_post: uidNext && titleNext ? {
        uid: uidNext, 
        title: titleNext,
      }: null,
      previous_post: uidPreview && titlePreview ? {
        uid: uidPreview,
        title: titlePreview,
      }: null

    }
  }
};
