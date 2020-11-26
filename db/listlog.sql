create table log(
  id int not null auto_increment,
  timestamp datetime ,
  userid varchar(40) ,
  message varchar(400),
  primary key(id)
);