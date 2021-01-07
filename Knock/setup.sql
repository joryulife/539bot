use Knockdb;
create table qs_ob(qs_id varchar(20) primary key,qs_url varchar(100),cs1 varchar(20),cs2 varchar(20),cs3 varchar(20),cs4 varchar(20),CorrectAns varchar(20),password varchar(20),Description varchar(200),createusr varchar(35));
create table usrlist(usr_id varchar(35) primary key,flag varchar(30),temp varchar(30),tempqs varchar(30),usr_name varchar(40));
create table qs_gplist(GP varchar(100) primary key,timer varchar(100),lastday datetime,password varchar(20),createusr varchar(35));
create table qs_list(qs_id varchar(20) primary key,GP varchar(100),timer varchar(30),lastday datetime(6),status bool);
create table rank_test001(usr_id varchar(35),usr_name varchar(40),time datetime(6));
create table rank_test002(usr_id varchar(35),usr_name varchar(40),time datetime(6));
create table rank_test003(usr_id varchar(35),usr_name varchar(40),time datetime(6));
create table usrgp_list(usr_id varchar(35),GP varchar(100),primary key(usr_id,GP));

insert into qs_ob values("test001","https://539bot-joryulife.codeanyapp.com/Knock/qsimage/A001.jpg","1/3","1/4","1/5","1/6","1/3","password","https://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba");
insert into qs_ob values("test002","https://539bot-joryulife.codeanyapp.com/Knock/qsimage/A001.jpg","1/3","1/4","1/5","1/6","1/3","password","https://noschool.asia/question/%E5%AE%9A%E7%A9%8D%E5%88%86%E3%81%AE%E5%95%8F%E9%A1%8C-2","U3aa127f38f35ddee3962757fe0d50eba");

insert into usrlist values("testusr001",'plane',null,null,'テストユーザー001');

insert into qs_gplist values("testgp1","0 * * * * *",null,"password","U3aa127f38f35ddee3962757fe0d50eba");
insert into qs_gplist values("testgp2","30 * * * * *",null,"password","U3aa127f38f35ddee3962757fe0d50eba");
/*insert into qs_gplist values("testgp3","0,30 * 18 07 01 *",null,"password","U3aa127f38f35ddee3962757fe0d50eba");*/

insert into qs_list values("test001","testgp1","0,30 * * * * *",null,false);
insert into qs_list values("test002","testgp2","0,30 * * * * *",cast('2020-12-16 21:00:00.000000' as datetime),false);
/*insert into qs_list values("test003","testgp3","0,30 * 18 07 01 *",cast('2020-12-16 21:00:00.000000' as datetime),false);*/

insert into usrgp_list values("U3aa127f38f35ddee3962757fe0d50eba","testgp1");
/*insert into usrgp_list values("Ucd77b5b80a9a97cf6a9066e408ff1203","testgp1");*/
insert into usrgp_list values("Uffabcf2ec5a3d50360ae705f95a1d909","testgp1");
insert into usrgp_list values("U2b948fca4c7ce8c760232c4d0218e713","testgp1");

insert into usrgp_list values("U3aa127f38f35ddee3962757fe0d50eba","testgp2");
/*insert into usrgp_list values("Ucd77b5b80a9a97cf6a9066e408ff1203","testgp2");*/
insert into usrgp_list values("Uffabcf2ec5a3d50360ae705f95a1d909","testgp2");
insert into usrgp_list values("U2b948fca4c7ce8c760232c4d0218e713","testgp2");

insert into rank_test001 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",now());
/*insert into rank_test001 values("Ucd77b5b80a9a97cf6a9066e408ff1203","祐貴",now());*/
insert into rank_test001 values("Uffabcf2ec5a3d50360ae705f95a1d909","ひろし",now());
insert into rank_test001 values("U2b948fca4c7ce8c760232c4d0218e713","あゆみ",now());

insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",now());
/*insert into rank_test002 values("Ucd77b5b80a9a97cf6a9066e408ff1203","祐貴",now());*/
insert into rank_test002 values("Uffabcf2ec5a3d50360ae705f95a1d909","ひろし",now());
insert into rank_test002 values("U2b948fca4c7ce8c760232c4d0218e713","あゆみ",now());

/*insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","拓巳",cast('2020-12-16 21:00:00.000000' as datetime));
insert into rank_test002 values("testuser002","テストユーザー002",cast('2020-12-16 21:05:00.000000' as datetime));
insert into rank_test002 values("testuser003","テストユーザー003",cast('2020-12-16 21:03:00.000000' as datetime));
insert into rank_test002 values("U3aa127f38f35ddee3962757fe0d50eba","テストユーザー004",cast('2020-12-13 21:03:00.000000' as datetime));*/