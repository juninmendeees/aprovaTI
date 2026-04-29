package com.aprovati.mapamental.repository;

import com.aprovati.mapamental.entity.MapaMental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MapaMentalRepository extends JpaRepository<MapaMental, Long> {

    @Query("""
            select m from MapaMental m
            where (:disciplina is null or upper(m.disciplina) = upper(:disciplina))
              and (:assunto is null or upper(m.assunto) like upper(concat('%', :assunto, '%')))
            order by m.disciplina asc, m.assunto asc, m.updatedAt desc
            """)
    List<MapaMental> listar(@Param("disciplina") String disciplina, @Param("assunto") String assunto);

    @Query("""
            select distinct m.disciplina from MapaMental m
            order by m.disciplina asc
            """)
    List<String> listarDisciplinas();
}
