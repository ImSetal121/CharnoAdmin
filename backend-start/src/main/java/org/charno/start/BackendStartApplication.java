package org.charno.start;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "org.charno")
@EnableR2dbcRepositories(basePackages = "org.charno.systementity.repository")
public class BackendStartApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendStartApplication.class, args);
    }

}
