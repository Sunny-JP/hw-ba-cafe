export interface NotificationMessage {
  title: string;
  body: string;
}

export const messages: NotificationMessage[] = [
  { 
    title: "先生！お仕事の時間ですよ！", 
    body: "生徒さんたちが待ってます！" 
  },
  { 
    title: "先生、お仕事お疲れ様です。", 
    body: "生徒のみなさんがお待ちです。" 
  },
];