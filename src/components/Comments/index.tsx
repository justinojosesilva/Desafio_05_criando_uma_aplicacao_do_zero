import { useEffect } from 'react';
import styles from './comments.module.scss';

export default function Comments() {

    useEffect(() => {
        const scriptComments = document.getElementById('commentId');
        if (!scriptComments) return;

        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.async = true;
        script.setAttribute('repo', `justinojosesilva/Desafio_05_criando_uma_aplicacao_do_zero`);
        script.setAttribute('issue-term', 'pathname');
        script.setAttribute('label', 'comment :speech_balloon:');
        script.setAttribute('theme', 'photon-dark');
        script.setAttribute('crossorigin', 'anonymous');

        scriptComments.appendChild(script);

        return () => {
            scriptComments.removeChild(scriptComments.firstChild);
        }


    }, []);

    return (
        <div className={styles.container} id="commentId"></div>
    );
}