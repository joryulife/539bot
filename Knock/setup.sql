use Knockdb;
create table qs_ob(qs_id varchar(20) primary key,qs_url varchar(1000),cs1 varchar(20),cs2 varchar(20),cs3 varchar(20),cs4 varchar(20),CorrectAns varchar(20),password varchar(20),Description varchar(1000),createusr varchar(35),must bool);
create table usrlist(usr_id varchar(35) primary key,flag varchar(30),temp varchar(20),tempqs varchar(20),usr_name varchar(40),target json);
create table qs_gplist(GP varchar(20) primary key,timer varchar(100),lastday datetime(6),password varchar(20),createusr varchar(35));
create table qs_list(qs_id varchar(20) primary key,GP varchar(100),timer varchar(30),lastday datetime(6),status bool);
create table rank_登録解除test(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_ランキングtest(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認001(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認002(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認003(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認004(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認005(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認006(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_確認007(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_配信test(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table rank_test(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));
create table usrgp_list(usr_id varchar(35),GP varchar(20),primary key(usr_id,GP));

insert into qs_ob values("解説test","https://539bot-joryulife.codeanyapp.com/Knock/qsimage/A001.jpg","1/3","1/4","1/5","1/6","1","password","∫[-1,0]x^2/1+2^(x)dx+∫[0,1]x^2/1+2^(x) dxと分けて第一項をx=-tに詳しくは\nhttps://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba",true);
insert into qs_ob values("配信test","https://539bot-joryulife.codeanyapp.com/Knock/qsimage/A001.jpg","1/3","1/4","1/5","1/6","1","password","∫[-1,0]x^2/1+2^(x)dx+∫[0,1]x^2/1+2^(x) dxと分けて第一項をx=-tに詳しくは\nhttps://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba",true);
insert into qs_ob values("登録解除test","https://539bot-joryulife.codeanyapp.com/Knock/qsimage/A001.jpg","1/3","1/4","1/5","1/6","1","password","∫[-1,0]x^2/1+2^(x)dx+∫[0,1]x^2/1+2^(x) dxと分けて第一項をx=-tに詳しくは\nhttps://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba",true);
insert into qs_ob values("test","https://i1.wp.com/math-note.xyz/wp-content/uploads/2020/04/Gauss%E7%A9%8D%E5%88%86.png?w=3000&ssl=1","1/3","1/4",null,null,"1","password","https://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba",false);
/*https://i1.wp.com/math-note.xyz/wp-content/uploads/2020/04/Gauss%E7%A9%8D%E5%88%86.png?w=3000&ssl=1*/
/*https://chart.apis.google.com/chart?cht=tx&chl=\[\int_a^b%20f(x)dx\]*/

insert into usrlist values("U3aa127f38f35ddee3962757fe0d50eba",'plane',null,null,'福應拓巳 🐗',null);
insert into usrlist values("Ucd77b5b80a9a97cf6a9066e408ff1203",'plane',null,null,'祐貴',null);
insert into usrlist values("Uffabcf2ec5a3d50360ae705f95a1d909",'plane',null,null,'Hiroshi Fukuo',null);
insert into usrlist values("U2b948fca4c7ce8c760232c4d0218e713",'plane',null,null,'福應あゆみ',null);

/*配信機能テスト*/
/*insert into qs_gplist values("配信testgp","0,15,30,45 * * * * *",cast('2021-01-10 21:00:00.000000' as datetime),"password","U3aa127f38f35ddee3962757fe0d50eba");*/
insert into qs_list values("配信test","配信testgp","0,15,30,45 * * * * *",cast('2021-01-05 21:00:00.000000' as datetime),false);
insert into rank_配信test values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",null,0);

/*登録解除機能確認*/
insert into qs_gplist values("登録解除testgp","0 0 0 * * *",cast('2021-01-10 21:00:00.000000' as datetime),"password","U3aa127f38f35ddee3962757fe0d50eba");
insert into qs_list values("登録解除test","登録解除testgp","30 * * * * *",cast('2021-01-05 21:00:00.000000' as datetime),false);

/*確認機能確認*/
insert into qs_gplist values("確認testgp","0 0 0 * * *",cast('2021-01-10 21:00:00.000000' as datetime),"password","U3aa127f38f35ddee3962757fe0d50eba");
insert into usrgp_list values("U3aa127f38f35ddee3962757fe0d50eba","確認testgp");

insert into qs_list values("確認001","確認testgp","30 * * * * *",cast('2021-01-05 21:00:00.000000' as datetime),false);
insert into qs_list values("確認002","確認testgp","30 * * * * *",cast('2021-01-06 21:00:00.000000' as datetime),false);
insert into qs_list values("確認003","確認testgp","30 * * * * *",cast('2021-01-07 21:00:00.000000' as datetime),false);
insert into qs_list values("確認004","確認testgp","30 * * * * *",cast('2021-01-08 21:00:00.000000' as datetime),false);
insert into qs_list values("確認005","確認testgp","30 * * * * *",cast('2021-01-09 21:00:00.000000' as datetime),false);
insert into qs_list values("確認006","確認testgp","30 * * * * *",cast('2021-01-10 21:00:00.000000' as datetime),false);
insert into qs_list values("確認007","確認testgp","30 * * * * *",cast('2021-01-11 21:00:00.000000' as datetime),false);

insert into rank_確認001 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",cast('2021-01-05 21:05:00.000000' as datetime),0);
insert into rank_確認002 values("U3aa127f38f35ddee3962757fe0d50eba","テスト1",cast('2021-01-06 21:06:00.000000' as datetime),0);
insert into rank_確認003 values("U3aa127f38f35ddee3962757fe0d50eba","テスト2",cast('2021-01-07 21:07:00.000000' as datetime),0);
insert into rank_確認004 values("U3aa127f38f35ddee3962757fe0d50eba","テスト3",cast('2021-01-08 21:08:00.000000' as datetime),0);
insert into rank_確認005 values("U3aa127f38f35ddee3962757fe0d50eba","テスト4",cast('2021-01-09 21:09:00.000000' as datetime),0);
insert into rank_確認006 values("U3aa127f38f35ddee3962757fe0d50eba","テスト5",cast('2021-01-09 21:10:00.000000' as datetime),0);
insert into rank_確認007 values("U3aa127f38f35ddee3962757fe0d50eba","テスト6",cast('2021-01-11 21:11:00.000000' as datetime),0);

/*ランキング機能確認*/
/*insert into qs_gplist values("ランキングtestgp","0 0 0 * * *",cast('2021-01-10 21:00:00.000000' as datetime),"password","U3aa127f38f35ddee3962757fe0d50eba");
*/
insert into usrgp_list values("U3aa127f38f35ddee3962757fe0d50eba","ランキングtestgp");

insert into qs_list values("ランキングtest","ランキングtestgp","30 * * * * *",cast('2021-01-05 21:00:00.000000' as datetime),false);

insert into rank_ランキングtest values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",cast('2021-01-13 09:05:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebb","テスト1",cast('2021-01-13 09:06:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebc","テスト2",cast('2021-01-13 09:07:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebd","テスト3",cast('2021-01-13 09:08:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebe","テスト4",cast('2021-01-13 09:09:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebf","テスト5",cast('2021-01-13 09:10:00.000000' as datetime),0);
insert into rank_ランキングtest values("u3aa127f38f35ddee3962757fe0d50ebg","テスト6",cast('2021-01-13 09:11:00.000000' as datetime),0);
/*
insert into rank_test001 values("Ucd77b5b80a9a97cf6a9066e408ff1203","祐貴",now(),0);
insert into rank_test001 values("Uffabcf2ec5a3d50360ae705f95a1d909","ひろし",now(),0);
insert into rank_test001 values("U2b948fca4c7ce8c760232c4d0218e713","あゆみ",now(),0);
*/

/*insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",cast('2021-01-13 09:05:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebb","テスト1",cast('2021-01-13 09:06:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebc","テスト2",cast('2021-01-13 09:07:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebd","テスト3",cast('2021-01-13 09:08:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebe","テスト4",cast('2021-01-13 09:09:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebf","テスト5",cast('2021-01-13 09:10:00.000000' as datetime),0);
insert into rank_test002 values("u3aa127f38f35ddee3962757fe0d50ebg","テスト6",cast('2021-01-13 09:11:00.000000' as datetime),0);*/
/*insert into rank_test002 values("Ucd77b5b80a9a97cf6a9066e408ff1203","祐貴",now(),0);
insert into rank_test002 values("Uffabcf2ec5a3d50360ae705f95a1d909","ひろし",cast('2021-01-13 09:10:00.000000' as datetime),0);
insert into rank_test002 values("U2b948fca4c7ce8c760232c4d0218e713","あゆみ",cast('2021-01-13 09:12:00.000000' as datetime),0);*/

/*
insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",cast('2020-12-16 21:00:00.000000' as datetime),0);
insert into rank_test002 values("testuser002","テストユーザー002",cast('2020-12-16 21:05:00.000000' as datetime),0);
insert into rank_test002 values("testuser003","テストユーザー003",cast('2020-12-16 21:03:00.000000' as datetime),0);
insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","テストユーザー004",cast('2020-12-13 21:03:00.000000' as datetime),0);
*/